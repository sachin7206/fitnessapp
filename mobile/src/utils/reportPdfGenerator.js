import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Generate and share a fitness report PDF.
 * - Web: renders HTML in a hidden iframe → triggers browser print (Save as PDF).
 * - Native: uses expo-print + expo-sharing to produce a real .pdf file.
 */
export const generateReportPDF = async (exerciseReport, dietReport) => {
  // Validate: at least one report must be present
  if (!exerciseReport && !dietReport) {
    throw new Error('No report data available. Please generate a report first.');
  }

  const html = buildReportHTML(exerciseReport, dietReport);

  if (Platform.OS === 'web') {
    return downloadPDFWeb(html);
  }

  // ── Native (iOS / Android) ──
  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      Alert.alert('PDF Saved', `Report saved to:\n${uri}`);
    }
  } catch (e) {
    Alert.alert('PDF Error', 'Could not generate PDF.\n' + (e.message || ''));
  }
};

/**
 * Web-specific: create a hidden iframe, write the report HTML into it,
 * then invoke the browser's native print dialog (which has "Save as PDF").
 * This avoids popup-blocker issues entirely.
 */
function downloadPDFWeb(html) {
  try {
    // Remove any previous report iframe
    const prev = document.getElementById('__report_pdf_iframe');
    if (prev) prev.remove();

    const iframe = document.createElement('iframe');
    iframe.id = '__report_pdf_iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for content to render, then trigger print
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (printErr) {
        // Fallback: download the HTML file directly
        downloadHTMLFallback(html);
      }
      // Clean up iframe after a delay
      setTimeout(() => {
        try { iframe.remove(); } catch (_) {}
      }, 2000);
    }, 600);
  } catch (e) {
    // Final fallback: download HTML file
    downloadHTMLFallback(html);
  }
}

/**
 * Fallback: download the report as an .html file the user can open & print.
 */
function downloadHTMLFallback(html) {
  try {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fitness_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  } catch (e) {
    window.alert('Could not download report. Please try again.');
  }
}

// ── Safe helpers that never mutate inputs (Redux state is frozen) ──

/** Shallow-copy an array so .sort() won't mutate frozen Redux state */
function safeArray(arr) {
  return Array.isArray(arr) ? [...arr] : [];
}

/** Safely read an object — returns {} if null/undefined */
function safeObj(obj) {
  return obj && typeof obj === 'object' ? obj : {};
}

// ── HTML builders ──

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
<p class="subtitle">Generated on ${esc(now)}</p>
${exerciseReport ? buildExerciseHTML(exerciseReport) : ''}
${dietReport ? buildDietHTML(dietReport) : ''}
</body></html>`;
}

function buildExerciseHTML(r) {
  let html = `<h2>🏋️ Exercise Report (${esc(r.startDate || '')} → ${esc(r.endDate || '')})</h2>`;

  const totalExercisesLogged = r.totalExercisesLogged || 0;
  const totalVolumeLifted = r.totalVolumeLifted || 0;
  const fmtVol = (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : Math.round(v).toLocaleString();

  html += `<div class="summary-grid">
    <div class="summary-box"><div class="val">${r.totalWorkoutDays || 0}</div><div class="lbl">Workout Days</div></div>
    <div class="summary-box"><div class="val">${Object.keys(safeObj(r.exerciseFrequency)).length}</div><div class="lbl">Exercises</div></div>
    <div class="summary-box"><div class="val">${safeArray(r.personalBests).length}</div><div class="lbl">Personal Bests</div></div>
  </div>
  <div class="summary-grid">
    <div class="summary-box"><div class="val">${totalExercisesLogged}</div><div class="lbl">Total Logs</div></div>
    <div class="summary-box"><div class="val">${fmtVol(totalVolumeLifted)}</div><div class="lbl">Total Volume (kg)</div></div>
  </div>`;

  // Frequency — Object.entries creates a new array, safe to sort
  const freq = Object.entries(safeObj(r.exerciseFrequency)).sort((a, b) => b[1] - a[1]);
  if (freq.length) {
    html += `<h3>Exercise Frequency</h3><table><tr><th>Exercise</th><th>Edits</th></tr>`;
    freq.forEach(([name, count]) => { html += `<tr><td>${esc(name)}</td><td>${count}×</td></tr>`; });
    html += `</table>`;
  }

  // Bests — safeArray() creates a copy so .sort() won't crash on frozen Redux state
  const bests = safeArray(r.personalBests).sort((a, b) => (b.bestWeight || 0) - (a.bestWeight || 0));
  if (bests.length) {
    html += `<h3>Personal Bests</h3><table><tr><th>Exercise</th><th>Best Weight</th><th>Reps</th><th>Date</th></tr>`;
    bests.forEach(pb => {
      html += `<tr><td>${esc(pb.exerciseName)}</td><td><span class="badge">${pb.bestWeight || 0} kg</span></td><td>${pb.reps || 0}</td><td>${esc(pb.date || '')}</td></tr>`;
    });
    html += `</table>`;
  }

  // Per-exercise edit history
  const histories = safeArray(r.exerciseHistories);
  if (histories.length) {
    html += `<h3>Exercise Details &amp; Edit History</h3>`;
    histories.forEach(exHist => {
      html += `<div style="margin-bottom:16px;border:1px solid #eee;border-radius:8px;overflow:hidden;">`;
      html += `<div style="background:#F4F4FA;padding:8px 12px;">
        <strong>${esc(exHist.exerciseName)}</strong>
        <span style="color:#6c757d;font-size:12px;margin-left:8px;">
          ${exHist.totalEdits || 0} edits · Avg ${exHist.avgWeight || 0} kg × ${exHist.avgReps || 0} reps · Max ${exHist.maxWeight || 0} kg · Max ${exHist.maxReps || 0} reps
        </span>
      </div>`;
      const edits = safeArray(exHist.edits);
      if (edits.length) {
        html += `<table><tr><th>#</th><th>Date</th><th>Sets</th><th>Volume</th><th>vs Previous</th></tr>`;
        edits.forEach((edit, eIdx) => {
          const dateStr = edit.loggedAt ? esc(edit.loggedAt.substring(0, 16).replace('T', ' ')) : '';
          const sets = safeArray(edit.sets);
          const setsStr = sets.map((s, i) => `S${i + 1}: ${s.reps || 0}×${s.weight || 0}kg`).join(', ');
          const vol = Math.round(edit.totalVolume || 0);
          let diffStr = '-';
          if (eIdx > 0) {
            const prevSets = safeArray(edits[eIdx - 1].sets);
            const prevMax = prevSets.length > 0 ? Math.max(...prevSets.map(s => s.weight || 0)) : 0;
            const currMax = sets.length > 0 ? Math.max(...sets.map(s => s.weight || 0)) : 0;
            const diff = currMax - prevMax;
            if (diff !== 0) {
              diffStr = `<span class="${diff > 0 ? 'under' : 'over'}">${diff > 0 ? '+' : ''}${diff} kg</span>`;
            } else {
              diffStr = '<span class="on">0 kg</span>';
            }
          }
          html += `<tr><td>${eIdx + 1}</td><td style="font-size:11px;">${dateStr}</td><td style="font-size:11px;">${esc(setsStr)}</td><td>${vol}</td><td>${diffStr}</td></tr>`;
        });
        html += `</table>`;
      }
      html += `</div>`;
    });
  }

  // Volume
  const volumeList = safeArray(r.volumeProgression);
  if (volumeList.length) {
    html += `<h3>Volume Progression</h3><table><tr><th>Date</th><th>Total Volume</th><th>Exercises</th></tr>`;
    volumeList.forEach(dv => {
      html += `<tr><td>${esc(dv.date || '')}</td><td>${fmtVol(dv.totalVolume || 0)}</td><td>${dv.exerciseCount || 0}</td></tr>`;
    });
    html += `</table>`;
  }

  return html;
}

function buildDietHTML(r) {
  let html = `<h2>🥗 Diet Report (${esc(r.startDate || '')} → ${esc(r.endDate || '')})</h2>`;
  const t = safeObj(r.targets);
  const a = safeObj(r.averages);

  html += `<div class="summary-grid">
    <div class="summary-box"><div class="val">${r.totalTrackedDays || 0}</div><div class="lbl">Days Tracked</div></div>
    <div class="summary-box"><div class="val">${a.avgCalories || 0}</div><div class="lbl">Avg Cal</div></div>
    <div class="summary-box"><div class="val">${a.avgProtein || 0}g</div><div class="lbl">Avg Protein</div></div>
  </div>`;

  if (t.targetCalories) {
    html += `<h3>Daily Targets: ${t.targetCalories} kcal · ${t.targetProtein || 0}g P · ${t.targetCarbs || 0}g C · ${t.targetFat || 0}g F</h3>`;
  }

  const breakdown = safeArray(r.dailyBreakdown);
  if (breakdown.length) {
    html += `<h3>Daily Breakdown</h3><table><tr><th>Date</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Macros %</th></tr>`;
    breakdown.forEach(d => {
      const cv = d.calorieVariance || 0;
      const pv = d.proteinVariance || 0;
      const cbv = d.carbsVariance || 0;
      const fv = d.fatVariance || 0;

      const dayP = d.protein || 0;
      const dayC = d.carbs || 0;
      const dayF = d.fat || 0;
      const dayTotalGrams = dayP + dayC + dayF;
      const pPct = dayTotalGrams > 0 ? Math.round((dayP / dayTotalGrams) * 100) : 0;
      const cPct = dayTotalGrams > 0 ? Math.round((dayC / dayTotalGrams) * 100) : 0;
      const fPct = dayTotalGrams > 0 ? 100 - pPct - cPct : 0;

      html += `<tr>
        <td>${esc(d.date || '')}</td>
        <td>${d.calories || 0} <span class="${cv > 0 ? 'over' : cv < 0 ? 'under' : 'on'}">(${cv > 0 ? '+' : ''}${Math.round(cv)})</span></td>
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
  if (breakdown.length && t.targetCalories) {
    html += `<h3>Average Variance vs Target</h3><table><tr><th>Macro</th><th>Avg</th><th>Target</th><th>Variance</th></tr>`;
    const rows = [
      { label: 'Calories', avg: a.avgCalories, tgt: t.targetCalories, unit: 'kcal' },
      { label: 'Protein', avg: a.avgProtein, tgt: t.targetProtein, unit: 'g' },
      { label: 'Carbs', avg: a.avgCarbs, tgt: t.targetCarbs, unit: 'g' },
      { label: 'Fat', avg: a.avgFat, tgt: t.targetFat, unit: 'g' },
    ];
    rows.forEach(row => {
      const diff = (row.avg || 0) - (row.tgt || 0);
      const cls = row.label === 'Calories' ? (diff > 0 ? 'over' : 'under') : (row.label === 'Protein' ? (diff >= 0 ? 'under' : 'over') : (diff > 0 ? 'over' : 'under'));
      const sign = diff > 0 ? '+' : '';
      html += `<tr><td>${row.label}</td><td>${row.avg || 0} ${row.unit}</td><td>${row.tgt || 0} ${row.unit}</td><td class="${cls}">${sign}${round1(diff)} ${row.unit}</td></tr>`;
    });
    html += `</table>`;
  }

  return html;
}

/** HTML-escape to prevent XSS when embedding user data in HTML */
function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function round1(n) { return Math.round((n || 0) * 10) / 10; }

