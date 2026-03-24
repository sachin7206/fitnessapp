import { Platform, Alert } from 'react-native';

/**
 * Generate and share a fitness report PDF.
 * Uses expo-print + expo-sharing when available; falls back to browser print on web.
 */
export const generateReportPDF = async (exerciseReport, dietReport) => {
  const html = buildReportHTML(exerciseReport, dietReport);

  if (Platform.OS === 'web') {
    // Web: open a new window and invoke print
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    } else {
      Alert.alert('Popup Blocked', 'Please allow popups to download the PDF.');
    }
    return;
  }

  // Native: use expo-print + expo-sharing
  try {
    const Print = require('expo-print');
    const Sharing = require('expo-sharing');
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      Alert.alert('PDF Saved', `Report saved to:\n${uri}`);
    }
  } catch (e) {
    // If modules aren't installed, fallback alert
    Alert.alert('PDF Export', 'Install expo-print and expo-sharing for native PDF export.\n\n' + (e.message || ''));
  }
};

function buildReportHTML(exerciseReport, dietReport) {
  const now = new Date().toLocaleDateString();
  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>Fitness Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #212529; padding: 32px; background: #fff; }
  h1 { color: #111827; font-size: 26px; margin-bottom: 4px; }
  .subtitle { color: #6c757d; font-size: 13px; margin-bottom: 24px; }
  h2 { font-size: 18px; margin: 24px 0 8px; color: #212529; border-bottom: 2px solid #111827; padding-bottom: 4px; }
  h3 { font-size: 14px; margin: 16px 0 6px; color: #6c757d; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
  th { background: #F4F4FA; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #6c757d; }
  td { padding: 8px; border-bottom: 1px solid #f0f0f0; }
  tr:nth-child(even) { background: #FAFAFE; }
  .over { color: #EF4444; font-weight: 600; }
  .under { color: #22C55E; font-weight: 600; }
  .on { color: #6c757d; }
  .badge { display: inline-block; background: rgba(247,184,1,0.15); color: #E6A200; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
  .summary-grid { display: flex; gap: 16px; margin: 12px 0; }
  .summary-box { flex: 1; background: #F4F4FA; border-radius: 10px; padding: 12px; text-align: center; }
  .summary-box .val { font-size: 22px; font-weight: 800; color: #111827; }
  .summary-box .lbl { font-size: 11px; color: #6c757d; }
  @media print { body { padding: 16px; } }
</style>
</head><body>
<h1>📊 Fitness Report</h1>
<p class="subtitle">Generated on ${now}</p>
${exerciseReport ? buildExerciseHTML(exerciseReport) : ''}
${dietReport ? buildDietHTML(dietReport) : ''}
</body></html>`;
}

function buildExerciseHTML(r) {
  let html = `<h2>🏋️ Exercise Report (${r.startDate} → ${r.endDate})</h2>`;

  const totalExercisesLogged = r.totalExercisesLogged || 0;
  const totalVolumeLifted = r.totalVolumeLifted || 0;
  const fmtVol = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : Math.round(v).toLocaleString();

  html += `<div class="summary-grid">
    <div class="summary-box"><div class="val">${r.totalWorkoutDays}</div><div class="lbl">Workout Days</div></div>
    <div class="summary-box"><div class="val">${Object.keys(r.exerciseFrequency || {}).length}</div><div class="lbl">Exercises</div></div>
    <div class="summary-box"><div class="val">${(r.personalBests || []).length}</div><div class="lbl">Personal Bests</div></div>
  </div>
  <div class="summary-grid">
    <div class="summary-box"><div class="val">${totalExercisesLogged}</div><div class="lbl">Total Logs</div></div>
    <div class="summary-box"><div class="val">${fmtVol(totalVolumeLifted)}</div><div class="lbl">Total Volume (kg)</div></div>
  </div>`;

  // Frequency
  const freq = Object.entries(r.exerciseFrequency || {}).sort((a, b) => b[1] - a[1]);
  if (freq.length) {
    html += `<h3>Exercise Frequency</h3><table><tr><th>Exercise</th><th>Edits</th></tr>`;
    freq.forEach(([name, count]) => { html += `<tr><td>${esc(name)}</td><td>${count}×</td></tr>`; });
    html += `</table>`;
  }

  // Bests
  if (r.personalBests?.length) {
    html += `<h3>Personal Bests</h3><table><tr><th>Exercise</th><th>Best Weight</th><th>Reps</th><th>Date</th></tr>`;
    r.personalBests.sort((a, b) => b.bestWeight - a.bestWeight).forEach(pb => {
      html += `<tr><td>${esc(pb.exerciseName)}</td><td><span class="badge">${pb.bestWeight} kg</span></td><td>${pb.reps}</td><td>${pb.date}</td></tr>`;
    });
    html += `</table>`;
  }

  // Per-exercise edit history
  if (r.exerciseHistories?.length) {
    html += `<h3>Exercise Details & Edit History</h3>`;
    r.exerciseHistories.forEach(exHist => {
      html += `<div style="margin-bottom:16px;border:1px solid #eee;border-radius:8px;overflow:hidden;">`;
      html += `<div style="background:#F4F4FA;padding:8px 12px;">
        <strong>${esc(exHist.exerciseName)}</strong>
        <span style="color:#6c757d;font-size:12px;margin-left:8px;">
          ${exHist.totalEdits} edits · Avg ${exHist.avgWeight} kg × ${exHist.avgReps} reps · Max ${exHist.maxWeight} kg · Max ${exHist.maxReps} reps
        </span>
      </div>`;
      if (exHist.edits?.length) {
        html += `<table><tr><th>#</th><th>Date</th><th>Sets</th><th>Volume</th><th>vs Previous</th></tr>`;
        exHist.edits.forEach((edit, eIdx) => {
          const dateStr = edit.loggedAt ? edit.loggedAt.substring(0, 16).replace('T', ' ') : '';
          const setsStr = (edit.sets || []).map((s, i) => `S${i + 1}: ${s.reps}×${s.weight}kg`).join(', ');
          const vol = Math.round(edit.totalVolume || 0);
          let diffStr = '-';
          if (eIdx > 0) {
            const prevMax = Math.max(...(exHist.edits[eIdx - 1].sets || []).map(s => s.weight || 0));
            const currMax = Math.max(...(edit.sets || []).map(s => s.weight || 0));
            const diff = currMax - prevMax;
            if (diff !== 0) {
              diffStr = `<span class="${diff > 0 ? 'under' : 'over'}">${diff > 0 ? '+' : ''}${diff} kg</span>`;
            } else {
              diffStr = '<span class="on">0 kg</span>';
            }
          }
          html += `<tr><td>${eIdx + 1}</td><td style="font-size:11px;">${dateStr}</td><td style="font-size:11px;">${setsStr}</td><td>${vol}</td><td>${diffStr}</td></tr>`;
        });
        html += `</table>`;
      }
      html += `</div>`;
    });
  }

  // Volume
  if (r.volumeProgression?.length) {
    html += `<h3>Volume Progression</h3><table><tr><th>Date</th><th>Total Volume</th><th>Exercises</th></tr>`;
    r.volumeProgression.forEach(dv => {
      html += `<tr><td>${dv.date}</td><td>${fmtVol(dv.totalVolume)}</td><td>${dv.exerciseCount}</td></tr>`;
    });
    html += `</table>`;
  }

  return html;
}

function buildDietHTML(r) {
  let html = `<h2>🥗 Diet Report (${r.startDate} → ${r.endDate})</h2>`;
  const t = r.targets || {};
  const a = r.averages || {};

  html += `<div class="summary-grid">
    <div class="summary-box"><div class="val">${r.totalTrackedDays}</div><div class="lbl">Days Tracked</div></div>
    <div class="summary-box"><div class="val">${a.avgCalories || 0}</div><div class="lbl">Avg Cal</div></div>
    <div class="summary-box"><div class="val">${a.avgProtein || 0}g</div><div class="lbl">Avg Protein</div></div>
  </div>`;

  if (t.targetCalories) {
    html += `<h3>Daily Targets: ${t.targetCalories} kcal · ${t.targetProtein}g P · ${t.targetCarbs}g C · ${t.targetFat}g F</h3>`;
  }

  if (r.dailyBreakdown?.length) {
    html += `<h3>Daily Breakdown</h3><table><tr><th>Date</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Macros %</th></tr>`;
    r.dailyBreakdown.forEach(d => {
      const cv = d.calorieVariance;
      const pv = d.proteinVariance;
      const cbv = d.carbsVariance;
      const fv = d.fatVariance;

      // Compute macro gram percentages
      const dayP = d.protein || 0;
      const dayC = d.carbs || 0;
      const dayF = d.fat || 0;
      const dayTotalGrams = dayP + dayC + dayF;
      const pPct = dayTotalGrams > 0 ? Math.round((dayP / dayTotalGrams) * 100) : 0;
      const cPct = dayTotalGrams > 0 ? Math.round((dayC / dayTotalGrams) * 100) : 0;
      const fPct = dayTotalGrams > 0 ? 100 - pPct - cPct : 0;

      html += `<tr>
        <td>${d.date}</td>
        <td>${d.calories} <span class="${cv > 0 ? 'over' : cv < 0 ? 'under' : 'on'}">(${cv > 0 ? '+' : ''}${Math.round(cv)})</span></td>
        <td>${round1(d.protein)}g <span class="${pv >= 0 ? 'under' : 'over'}">(${pv > 0 ? '+' : ''}${round1(pv)})</span></td>
        <td>${round1(d.carbs)}g <span class="${cbv > 0 ? 'over' : cbv < 0 ? 'under' : 'on'}">(${cbv > 0 ? '+' : ''}${round1(cbv)})</span></td>
        <td>${round1(d.fat)}g <span class="${fv > 0 ? 'over' : fv < 0 ? 'under' : 'on'}">(${fv > 0 ? '+' : ''}${round1(fv)})</span></td>
        <td style="text-align:center">
          <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin-bottom:4px;">
            <div style="flex:${Math.max(pPct, 1)};background:#111827;"></div>
            <div style="flex:${Math.max(cPct, 1)};background:#6B7280;"></div>
            <div style="flex:${Math.max(fPct, 1)};background:#9CA3AF;"></div>
          </div>
          <span style="font-size:9px;"><span style="color:#111827;font-weight:700;">P:${pPct}%</span> <span style="color:#6B7280;font-weight:700;">C:${cPct}%</span> <span style="color:#9CA3AF;font-weight:700;">F:${fPct}%</span></span>
        </td>
      </tr>`;
    });
    html += `</table>`;
  }

  // Variance summary
  if (r.dailyBreakdown?.length && t.targetCalories) {
    html += `<h3>Average Variance vs Target</h3><table><tr><th>Macro</th><th>Avg</th><th>Target</th><th>Variance</th></tr>`;
    const rows = [
      { label: 'Calories', avg: a.avgCalories, tgt: t.targetCalories, unit: 'kcal' },
      { label: 'Protein', avg: a.avgProtein, tgt: t.targetProtein, unit: 'g' },
      { label: 'Carbs', avg: a.avgCarbs, tgt: t.targetCarbs, unit: 'g' },
      { label: 'Fat', avg: a.avgFat, tgt: t.targetFat, unit: 'g' },
    ];
    rows.forEach(row => {
      const diff = (row.avg || 0) - row.tgt;
      const cls = row.label === 'Calories' ? (diff > 0 ? 'over' : 'under') : (row.label === 'Protein' ? (diff >= 0 ? 'under' : 'over') : (diff > 0 ? 'over' : 'under'));
      const sign = diff > 0 ? '+' : '';
      html += `<tr><td>${row.label}</td><td>${row.avg || 0} ${row.unit}</td><td>${row.tgt} ${row.unit}</td><td class="${cls}">${sign}${round1(diff)} ${row.unit}</td></tr>`;
    });
    html += `</table>`;
  }

  return html;
}

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function round1(n) { return Math.round((n || 0) * 10) / 10; }


