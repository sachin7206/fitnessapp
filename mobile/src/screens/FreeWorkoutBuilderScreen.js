import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Platform, Modal, KeyboardAvoidingView,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import workoutService from '../services/workoutService';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const MUSCLE_GROUPS = [
  { key: 'CHEST', label: '🫁 Chest' },
  { key: 'BACK', label: '🏋️‍♂️ Back' },
  { key: 'LEGS', label: '🦵 Legs' },
  { key: 'SHOULDERS', label: '💪 Shoulders' },
  { key: 'ARMS', label: '💪 Arms' },
  { key: 'CORE', label: '🎯 Core' },
  { key: 'FULL_BODY', label: '🏋️ Full Body' },
  { key: 'CARDIO', label: '❤️ Cardio' },
];

const MUSCLE_ICONS = {
  'CHEST': '🫁', 'BACK': '🏋️‍♂️', 'LEGS': '🦵', 'SHOULDERS': '💪',
  'ARMS': '💪', 'FULL_BODY': '🏋️', 'CARDIO': '❤️', 'CORE': '🎯',
};

const formatLabel = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

// Numeric input filters
const filterInteger = (val) => val.replace(/[^0-9]/g, '');
const filterDecimal = (val) => {
  const cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
};

const FreeWorkoutBuilderScreen = ({ navigation }) => {
  const [planName, setPlanName] = useState('My Custom Workout');
  const [selectedDays, setSelectedDays] = useState(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const [exercises, setExercises] = useState({}); // { MONDAY: [{name, sets, reps, weight, muscleGroup, isCardio, durationMinutes}], ... }
  const [activeDay, setActiveDay] = useState('MONDAY');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = adding new, number = editing index

  // New exercise form
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newSets, setNewSets] = useState('3');
  const [newSetDetails, setNewSetDetails] = useState([
    { reps: '12', weight: '' },
    { reps: '12', weight: '' },
    { reps: '12', weight: '' },
  ]);
  const [applySameReps, setApplySameReps] = useState(false);
  const [applySameWeight, setApplySameWeight] = useState(false);
  const [newMuscleGroup, setNewMuscleGroup] = useState('CHEST');
  const [newIsCardio, setNewIsCardio] = useState(false);
  const [newDurationMinutes, setNewDurationMinutes] = useState('20');
  const [newRestSeconds, setNewRestSeconds] = useState('60');

  const [saving, setSaving] = useState(false);
  const [restDay, setRestDay] = useState('');

  // Only load existing plan if user is explicitly editing (not creating new)
  useEffect(() => {
    // New plan always starts fresh
  }, []);


  const toggleDay = (day) => {
    setSelectedDays(prev => {
      const updated = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      if (day === restDay) setRestDay('');
      return updated;
    });
  };

  const toggleRestDay = (day) => {
    setRestDay(prev => prev === day ? '' : day);
  };

  const getAvailableRestDays = () => {
    return DAYS.filter(d => !selectedDays.includes(d));
  };

  const getWeeklyCyclePreview = () => {
    const sortedWorkoutDays = selectedDays.slice().sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
    const preview = {};
    let cycleIndex = 0;
    DAYS.forEach(day => {
      if (selectedDays.includes(day)) {
        preview[day] = { type: 'workout', source: day };
      } else if (day === restDay) {
        preview[day] = { type: 'rest', source: null };
      } else {
        preview[day] = { type: 'cycle', source: sortedWorkoutDays[cycleIndex % sortedWorkoutDays.length] };
        cycleIndex++;
      }
    });
    return preview;
  };

  const openAddExercise = () => {
    setEditingIndex(null);
    setNewExerciseName('');
    setNewSets('3');
    setNewSetDetails([
      { reps: '12', weight: '' },
      { reps: '12', weight: '' },
      { reps: '12', weight: '' },
    ]);
    setApplySameReps(false);
    setApplySameWeight(false);
    setNewMuscleGroup('CHEST');
    setNewIsCardio(false);
    setNewDurationMinutes('20');
    setNewRestSeconds('60');
    setShowAddExercise(true);
  };

  const openEditExercise = (index) => {
    const ex = exercises[activeDay]?.[index];
    if (!ex) return;
    setEditingIndex(index);
    setNewExerciseName(ex.name);
    const numSets = ex.sets || 3;
    setNewSets(String(numSets));
    // Restore per-set details if available, otherwise replicate single values
    if (ex.setDetails && ex.setDetails.length > 0) {
      setNewSetDetails(ex.setDetails.map(s => ({ reps: String(s.reps || ''), weight: s.weight ? String(s.weight) : '' })));
    } else {
      setNewSetDetails(
        Array.from({ length: numSets }, () => ({
          reps: String(ex.reps || 12),
          weight: ex.weight ? String(ex.weight) : '',
        }))
      );
    }
    setApplySameReps(false);
    setApplySameWeight(false);
    setNewMuscleGroup(ex.muscleGroup || 'CHEST');
    setNewIsCardio(ex.isCardio || false);
    setNewDurationMinutes(String(ex.durationMinutes || 20));
    setNewRestSeconds(String(ex.restSeconds || 60));
    setShowAddExercise(true);
  };

  const saveExercise = () => {
    if (!newExerciseName.trim()) {
      const msg = 'Please enter exercise name';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }

    const numSets = parseInt(newSets) || 3;
    const setDetails = newSetDetails.slice(0, numSets).map(s => ({
      reps: parseInt(s.reps) || 12,
      weight: s.weight ? parseFloat(s.weight) : null,
    }));

    const exercise = {
      name: newExerciseName.trim(),
      sets: numSets,
      reps: setDetails[0]?.reps || 12, // primary reps for backward compat
      weight: setDetails[0]?.weight || null, // primary weight for backward compat
      setDetails, // per-set details array
      muscleGroup: newMuscleGroup,
      isCardio: newIsCardio,
      durationMinutes: newIsCardio ? (parseInt(newDurationMinutes) || 20) : null,
      restSeconds: parseInt(newRestSeconds) || 60,
    };

    setExercises(prev => {
      const dayExercises = [...(prev[activeDay] || [])];
      if (editingIndex !== null) {
        dayExercises[editingIndex] = exercise;
      } else {
        dayExercises.push(exercise);
      }
      return { ...prev, [activeDay]: dayExercises };
    });

    setShowAddExercise(false);
  };

  // Handle sets count change
  const handleSetsChange = (val) => {
    const filtered = filterInteger(val);
    setNewSets(filtered);
    const num = parseInt(filtered) || 0;
    if (num > 0 && num <= 20) {
      setNewSetDetails(prev => {
        const updated = [...prev];
        while (updated.length < num) {
          updated.push({ reps: prev[0]?.reps || '12', weight: prev[0]?.weight || '' });
        }
        return updated.slice(0, num);
      });
    }
  };

  // Update individual set detail
  const updateSetDetail = (setIdx, field, value) => {
    const filtered = field === 'weight' ? filterDecimal(value) : filterInteger(value);
    setNewSetDetails(prev => {
      const updated = [...prev];
      updated[setIdx] = { ...updated[setIdx], [field]: filtered };
      if (setIdx === 0) {
        if (field === 'reps' && applySameReps) {
          for (let i = 1; i < updated.length; i++) {
            updated[i] = { ...updated[i], reps: filtered };
          }
        }
        if (field === 'weight' && applySameWeight) {
          for (let i = 1; i < updated.length; i++) {
            updated[i] = { ...updated[i], weight: filtered };
          }
        }
      }
      return updated;
    });
  };

  // Toggle apply same reps
  const toggleApplySameReps = () => {
    const newVal = !applySameReps;
    setApplySameReps(newVal);
    if (newVal && newSetDetails.length > 0) {
      const firstReps = newSetDetails[0].reps;
      setNewSetDetails(prev => prev.map((s, i) => i === 0 ? s : { ...s, reps: firstReps }));
    }
  };

  // Toggle apply same weight
  const toggleApplySameWeight = () => {
    const newVal = !applySameWeight;
    setApplySameWeight(newVal);
    if (newVal && newSetDetails.length > 0) {
      const firstWeight = newSetDetails[0].weight;
      setNewSetDetails(prev => prev.map((s, i) => i === 0 ? s : { ...s, weight: firstWeight }));
    }
  };

  const removeExercise = (index) => {
    const doRemove = () => {
      setExercises(prev => {
        const dayExercises = [...(prev[activeDay] || [])];
        dayExercises.splice(index, 1);
        return { ...prev, [activeDay]: dayExercises };
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Remove this exercise?')) doRemove();
    } else {
      Alert.alert('Remove Exercise', 'Remove this exercise?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  const copyDayExercises = (fromDay) => {
    if (!exercises[fromDay] || exercises[fromDay].length === 0) {
      const msg = `No exercises to copy from ${formatLabel(fromDay)}`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Nothing to Copy', msg);
      return;
    }
    setExercises(prev => ({
      ...prev,
      [activeDay]: [...exercises[fromDay].map(ex => ({ ...ex }))],
    }));
  };

  const handleSavePlan = async () => {
    // Validate at least one day is selected
    if (selectedDays.length === 0) {
      const msg = 'Please select at least one workout day';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('No Days Selected', msg);
      return;
    }

    // Validate every selected workout day has at least one exercise
    const emptyDays = selectedDays.filter(day => !(exercises[day] && exercises[day].length > 0));
    if (emptyDays.length > 0) {
      const dayNames = emptyDays.map(d => formatLabel(d)).join(', ');
      const msg = `Please add at least one exercise for each workout day.\n\nMissing exercises for: ${dayNames}`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Incomplete Plan', msg);
      return;
    }

    const totalExercises = Object.values(exercises).reduce((sum, dayExs) => sum + dayExs.length, 0);
    if (totalExercises === 0) {
      const msg = 'Please add at least one exercise to your plan';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Empty Plan', msg);
      return;
    }

    setSaving(true);
    try {
      // Build the request for backend
      const allExercises = [];
      selectedDays.forEach(day => {
        (exercises[day] || []).forEach((ex, idx) => {
          allExercises.push({
            exerciseName: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            setDetailsJson: ex.setDetails ? JSON.stringify(ex.setDetails) : null,
            muscleGroup: ex.muscleGroup,
            isCardio: ex.isCardio,
            durationSeconds: ex.isCardio ? (ex.durationMinutes || 20) * 60 : null,
            restTimeSeconds: ex.restSeconds || 60,
            dayOfWeek: day,
            order: idx + 1,
            caloriesBurned: ex.isCardio ? Math.round((ex.durationMinutes || 20) * 8) : Math.round((ex.sets || 3) * (ex.reps || 12) * 0.5),
          });
        });
      });

      const request = {
        planName: planName.trim() || 'My Custom Workout',
        planType: 'CUSTOM',
        daysPerWeek: selectedDays.length,
        restDay: restDay || null,
        exercises: allExercises,
      };

      const savedPlan = await workoutService.saveCustomWorkoutPlan(request);

      // Assign the plan immediately
      await workoutService.assignWorkoutPlan(savedPlan.id);

      const msg = 'Your custom workout plan has been created and assigned!';
      if (Platform.OS === 'web') {
        window.alert('Plan Created! 💪\n' + msg);
      } else {
        Alert.alert('Plan Created! 💪', msg);
      }

      navigation.navigate('FreeWorkoutView');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to save workout plan';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const activeDayExercises = exercises[activeDay] || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Workout</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plan Name */}
        <Text style={styles.sectionTitle}>📝 Plan Name</Text>
        <TextInput
          style={styles.nameInput}
          value={planName}
          onChangeText={setPlanName}
          placeholder="My Custom Workout"
          placeholderTextColor={colors.text.light}
        />

        {/* Day Selection */}
        <Text style={styles.sectionTitle}>📅 Workout Days</Text>
        <View style={styles.dayRow}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, selectedDays.includes(day) && styles.dayChipSelected]}
              onPress={() => toggleDay(day)}
            >
              <Text style={[styles.dayChipText, selectedDays.includes(day) && styles.dayChipTextSelected]}>
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rest Day Selection */}
        {getAvailableRestDays().length > 0 && (
          <>
            <Text style={styles.sectionTitle}>😴 Rest Day</Text>
            <Text style={styles.sectionHint}>Select a day for complete rest (optional)</Text>
            <View style={styles.dayRow}>
              {getAvailableRestDays().map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    restDay === day && styles.restDayChipSelected,
                  ]}
                  onPress={() => toggleRestDay(day)}
                >
                  <Text style={[
                    styles.dayChipText,
                    restDay === day && styles.restDayChipTextSelected,
                  ]}>
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Weekly Cycle Preview */}
        {selectedDays.length > 0 && selectedDays.length < 7 && (
          <View style={styles.cyclePreview}>
            <Text style={styles.cyclePreviewTitle}>📆 Weekly Schedule Preview</Text>
            {DAYS.map(day => {
              const info = getWeeklyCyclePreview()[day];
              return (
                <View key={day} style={styles.cycleRow}>
                  <Text style={styles.cycleDayName}>{formatLabel(day)}</Text>
                  {info.type === 'workout' ? (
                    <Text style={[styles.cycleSource, { color: colors.primary, fontWeight: '700' }]}>
                      🏋️ Workout Day
                    </Text>
                  ) : info.type === 'rest' ? (
                    <Text style={[styles.cycleSource, { color: '#FF9800', fontWeight: '700' }]}>
                      😴 Rest Day
                    </Text>
                  ) : (
                    <Text style={[styles.cycleSource, { color: colors.text.secondary }]}>
                      🔄 Same as {formatLabel(info.source)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Active Day Tabs */}
        <Text style={styles.sectionTitle}>🏋️ Exercises</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs}>
          {selectedDays.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)).map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.dayTab, activeDay === day && styles.dayTabActive]}
              onPress={() => setActiveDay(day)}
            >
              <Text style={[styles.dayTabText, activeDay === day && styles.dayTabTextActive]}>
                {formatLabel(day)}
              </Text>
              {(exercises[day] || []).length > 0 && (
                <View style={styles.dayTabBadge}>
                  <Text style={styles.dayTabBadgeText}>{(exercises[day] || []).length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exercise List for Active Day */}
        {activeDayExercises.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayIcon}>🏋️</Text>
            <Text style={styles.emptyDayText}>No exercises added for {formatLabel(activeDay)}</Text>
            <Text style={styles.emptyDayHint}>Tap the button below to add exercises</Text>
          </View>
        ) : (
          activeDayExercises.map((ex, idx) => (
            <View key={idx} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseIcon}>
                  {ex.isCardio ? '❤️' : (MUSCLE_ICONS[ex.muscleGroup] || '💪')}
                </Text>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseDetail}>
                    {ex.isCardio
                      ? `${ex.durationMinutes} min`
                      : ex.setDetails && ex.setDetails.length > 0
                        ? (() => {
                            const allSameReps = ex.setDetails.every(s => s.reps === ex.setDetails[0].reps);
                            const allSameWeight = ex.setDetails.every(s => s.weight === ex.setDetails[0].weight);
                            const repsText = allSameReps
                              ? `${ex.sets} sets × ${ex.setDetails[0].reps} reps`
                              : `${ex.sets} sets (${ex.setDetails.map(s => s.reps).join('/')}) reps`;
                            const hasWeight = ex.setDetails.some(s => s.weight);
                            const weightText = hasWeight
                              ? allSameWeight
                                ? ` • ${ex.setDetails[0].weight} kg`
                                : ` • ${ex.setDetails.map(s => s.weight || 0).join('/')} kg`
                              : '';
                            return repsText + weightText;
                          })()
                        : `${ex.sets} sets × ${ex.reps} reps${ex.weight ? ` • ${ex.weight} kg` : ''}`}
                  </Text>
                  {!ex.isCardio && (
                    <Text style={styles.exerciseMeta}>
                      {formatLabel(ex.muscleGroup)} • Rest {ex.restSeconds}s
                    </Text>
                  )}
                </View>
                <View style={styles.exerciseActions}>
                  <TouchableOpacity onPress={() => openEditExercise(idx)} style={styles.editBtn}>
                    <Text style={styles.editBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeExercise(idx)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Add Exercise Button */}
        <TouchableOpacity style={styles.addBtn} onPress={openAddExercise}>
          <Text style={styles.addBtnText}>+ Add Exercise</Text>
        </TouchableOpacity>

        {/* Copy from another day */}
        {selectedDays.filter(d => d !== activeDay && (exercises[d] || []).length > 0).length > 0 && (
          <View style={styles.copySection}>
            <Text style={styles.copySectionTitle}>📋 Copy from another day</Text>
            <View style={styles.copyRow}>
              {selectedDays
                .filter(d => d !== activeDay && (exercises[d] || []).length > 0)
                .map(d => (
                  <TouchableOpacity key={d} style={styles.copyChip} onPress={() => copyDayExercises(d)}>
                    <Text style={styles.copyChipText}>{formatLabel(d)}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Plan Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Workout days</Text>
            <Text style={styles.summaryValue}>{selectedDays.length} days/week</Text>
          </View>
          {restDay ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rest day</Text>
              <Text style={[styles.summaryValue, { color: '#FF9800' }]}>{formatLabel(restDay)}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total exercises</Text>
            <Text style={styles.summaryValue}>
              {Object.values(exercises).reduce((s, d) => s + d.length, 0)}
            </Text>
          </View>
          {selectedDays.map(day => {
            const count = (exercises[day] || []).length;
            const isMissing = count === 0;
            return (
              <View key={day} style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, isMissing && { color: '#D32F2F' }]}>
                  {isMissing ? '⚠️ ' : '✅ '}{formatLabel(day)}
                </Text>
                <Text style={[styles.summaryValue, isMissing && { color: '#D32F2F' }]}>
                  {count === 0 ? 'No exercises!' : `${count} exercises`}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Save Plan */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSavePlan}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving...' : '🚀 Save & Assign Plan'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>

      {/* Add/Edit Exercise Modal */}
      <Modal visible={showAddExercise} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingIndex !== null ? '✏️ Edit Exercise' : '➕ Add Exercise'}
              </Text>

              {/* Exercise Name */}
              <Text style={styles.inputLabel}>Exercise Name *</Text>
              <TextInput
                style={styles.input}
                value={newExerciseName}
                onChangeText={setNewExerciseName}
                placeholder="e.g., Bench Press, Squats, Running"
                placeholderTextColor={colors.text.light}
              />

              {/* Is Cardio Toggle */}
              <TouchableOpacity
                style={[styles.cardioToggle, newIsCardio && styles.cardioToggleActive]}
                onPress={() => setNewIsCardio(!newIsCardio)}
              >
                <Text style={styles.cardioToggleText}>
                  {newIsCardio ? '✅' : '⬜'} This is a cardio exercise
                </Text>
              </TouchableOpacity>

              {newIsCardio ? (
                <>
                  <Text style={styles.inputLabel}>Duration (minutes)</Text>
                  <TextInput
                    style={styles.input}
                    value={newDurationMinutes}
                    onChangeText={v => setNewDurationMinutes(filterInteger(v))}
                    keyboardType="numeric"
                    placeholder="20"
                  />
                </>
              ) : (
                <>
                  {/* Muscle Group */}
                  <Text style={styles.inputLabel}>Muscle Group</Text>
                  <View style={styles.muscleGrid}>
                    {MUSCLE_GROUPS.filter(m => m.key !== 'CARDIO').map(mg => (
                      <TouchableOpacity
                        key={mg.key}
                        style={[styles.muscleChip, newMuscleGroup === mg.key && styles.muscleChipSelected]}
                        onPress={() => setNewMuscleGroup(mg.key)}
                      >
                        <Text style={[styles.muscleChipText, newMuscleGroup === mg.key && styles.muscleChipTextSelected]}>
                          {mg.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Number of Sets */}
                  <Text style={styles.inputLabel}>Number of Sets</Text>
                  <TextInput
                    style={styles.input}
                    value={newSets}
                    onChangeText={handleSetsChange}
                    keyboardType="numeric"
                    placeholder="3"
                  />

                  {/* Per-set Reps & Weight */}
                  {newSetDetails.slice(0, parseInt(newSets) || 0).map((setItem, si) => (
                    <View key={si} style={styles.perSetRow}>
                      <Text style={styles.perSetLabel}>Set {si + 1}</Text>
                      <View style={styles.perSetInputs}>
                        <View style={styles.perSetField}>
                          <Text style={styles.perSetFieldLabel}>Reps</Text>
                          <TextInput
                            style={[styles.input, styles.perSetInput, (applySameReps && si > 0) && styles.inputDisabled]}
                            value={setItem.reps}
                            onChangeText={v => updateSetDetail(si, 'reps', v)}
                            keyboardType="numeric"
                            placeholder="12"
                            editable={!(applySameReps && si > 0)}
                          />
                        </View>
                        <View style={styles.perSetField}>
                          <Text style={styles.perSetFieldLabel}>Weight (kg)</Text>
                          <TextInput
                            style={[styles.input, styles.perSetInput, (applySameWeight && si > 0) && styles.inputDisabled]}
                            value={setItem.weight}
                            onChangeText={v => updateSetDetail(si, 'weight', v)}
                            keyboardType="numeric"
                            placeholder="0"
                            editable={!(applySameWeight && si > 0)}
                          />
                        </View>
                      </View>

                      {/* Show apply-same checkboxes after first set */}
                      {si === 0 && (parseInt(newSets) || 0) > 1 && (
                        <View style={styles.applySameContainer}>
                          {setItem.reps?.length > 0 && (
                            <TouchableOpacity style={styles.applySameRow} onPress={toggleApplySameReps}>
                              <Text style={styles.applySameCheck}>{applySameReps ? '☑️' : '⬜'}</Text>
                              <Text style={styles.applySameText}>Apply same reps to other sets</Text>
                            </TouchableOpacity>
                          )}
                          {setItem.weight?.length > 0 && (
                            <TouchableOpacity style={styles.applySameRow} onPress={toggleApplySameWeight}>
                              <Text style={styles.applySameCheck}>{applySameWeight ? '☑️' : '⬜'}</Text>
                              <Text style={styles.applySameText}>Apply same weight to other sets</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  ))}

                  {/* Rest Time */}
                  <Text style={styles.inputLabel}>Rest Between Sets (seconds)</Text>
                  <TextInput
                    style={styles.input}
                    value={newRestSeconds}
                    onChangeText={v => setNewRestSeconds(filterInteger(v))}
                    keyboardType="numeric"
                    placeholder="60"
                  />
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddExercise(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={saveExercise}>
                  <Text style={styles.modalSaveText}>
                    {editingIndex !== null ? 'Update' : 'Add Exercise'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backButton: { padding: spacing.xs },
  backText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  content: { flex: 1, padding: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text.primary, marginTop: spacing.lg, marginBottom: spacing.sm },
  nameInput: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    ...typography.body, color: colors.text.primary, borderWidth: 1, borderColor: colors.border || '#e0e0e0',
  },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dayChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full || 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border || '#e0e0e0',
  },
  dayChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '600' },
  dayChipTextSelected: { color: colors.text.inverse },
  restDayHint: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.sm },
  restDayChipSelected: { backgroundColor: colors.accent || '#FF9800', borderColor: colors.accent || '#FF9800' },
  restDayChipTextSelected: { color: colors.text.inverse },
  cycleInfoCard: {
    backgroundColor: colors.primary + '08', borderRadius: borderRadius.md, padding: spacing.md,
    marginTop: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  cycleInfoTitle: { ...typography.bodySmall, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  cycleInfoText: { ...typography.caption, color: colors.text.secondary, marginLeft: spacing.sm, lineHeight: 20 },
  dayTabs: { marginBottom: spacing.md },
  dayTab: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm,
    borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border || '#e0e0e0', flexDirection: 'row', alignItems: 'center',
  },
  dayTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayTabText: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '600' },
  dayTabTextActive: { color: colors.text.inverse },
  dayTabBadge: {
    backgroundColor: colors.accent, borderRadius: 10, width: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', marginLeft: spacing.xs,
  },
  dayTabBadgeText: { ...typography.caption, color: '#FFF', fontWeight: '700', fontSize: 10 },
  emptyDay: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl,
    alignItems: 'center', ...shadows.sm,
  },
  emptyDayIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyDayText: { ...typography.body, color: colors.text.primary, fontWeight: '600' },
  emptyDayHint: { ...typography.caption, color: colors.text.secondary, marginTop: spacing.xs },
  exerciseCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.sm, ...shadows.sm,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center' },
  exerciseIcon: { fontSize: 24, marginRight: spacing.sm },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  exerciseDetail: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
  exerciseMeta: { ...typography.caption, color: colors.text.light, marginTop: 2 },
  exerciseActions: { flexDirection: 'row', gap: spacing.sm },
  editBtn: { padding: spacing.xs },
  editBtnText: { fontSize: 18 },
  deleteBtn: { padding: spacing.xs },
  deleteBtnText: { fontSize: 18 },
  addBtn: {
    backgroundColor: colors.primary + '15', borderRadius: borderRadius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.sm, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
  },
  addBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  // Rest day chip styles
  restDayChipSelected: { backgroundColor: '#ff9800', borderColor: '#ff9800' },
  restDayChipTextSelected: { color: '#fff', fontWeight: '700' },
  sectionHint: { ...typography.caption, color: colors.text.light, marginBottom: spacing.sm },
  // Cycle preview
  cyclePreview: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginTop: spacing.lg, ...shadows.sm, borderWidth: 1, borderColor: colors.border || '#e0e0e0',
  },
  cyclePreviewTitle: { ...typography.body, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.md },
  cycleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border || '#e0e0e0',
  },
  cycleDayName: { ...typography.bodySmall, fontWeight: '600', color: colors.text.primary, width: 90 },
  cycleSource: { ...typography.bodySmall, flex: 1, textAlign: 'right' },
  copySection: { marginTop: spacing.lg },
  copySectionTitle: { ...typography.body, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.sm },
  copyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  copyChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md,
    backgroundColor: colors.info + '15', borderWidth: 1, borderColor: colors.info || colors.primary,
  },
  copyChipText: { ...typography.caption, color: colors.info || colors.primary, fontWeight: '600' },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg,
    marginTop: spacing.xl, ...shadows.sm,
  },
  summaryTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs,
    borderBottomWidth: 0.5, borderBottomColor: colors.border || '#e0e0e0',
  },
  summaryLabel: { ...typography.bodySmall, color: colors.text.secondary },
  summaryValue: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg,
    alignItems: 'center', marginTop: spacing.xl, ...shadows.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.h3, color: colors.text.inverse },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl || 20,
    borderTopRightRadius: borderRadius.xl || 20, padding: spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.lg },
  inputLabel: { ...typography.bodySmall, color: colors.text.primary, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md,
    ...typography.body, color: colors.text.primary, borderWidth: 1, borderColor: colors.border || '#e0e0e0',
  },
  row: { flexDirection: 'row', gap: spacing.md },
  halfInput: { flex: 1 },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  muscleChip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border || '#e0e0e0',
  },
  muscleChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  muscleChipText: { ...typography.caption, color: colors.text.primary },
  muscleChipTextSelected: { color: colors.text.inverse, fontWeight: '600' },
  cardioToggle: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.background, borderRadius: borderRadius.md, marginTop: spacing.md,
  },
  cardioToggleActive: { backgroundColor: colors.primary + '10', borderWidth: 1, borderColor: colors.primary },
  cardioToggleText: { ...typography.body, fontWeight: '600', color: colors.text.primary },
  // Per-set input styles
  perSetRow: {
    backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.sm,
    marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border || '#e0e0e0',
  },
  perSetLabel: { ...typography.bodySmall, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  perSetInputs: { flexDirection: 'row', gap: spacing.md },
  perSetField: { flex: 1 },
  perSetFieldLabel: { ...typography.caption, color: colors.text.secondary, marginBottom: 4 },
  perSetInput: { textAlign: 'center' },
  inputDisabled: { backgroundColor: colors.border || '#e8e8e8', opacity: 0.7 },
  applySameContainer: { marginTop: spacing.sm, paddingTop: spacing.xs },
  applySameRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  applySameCheck: { fontSize: 16, marginRight: spacing.sm },
  applySameText: { ...typography.bodySmall, color: colors.text.secondary, fontWeight: '500' },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  modalCancel: {
    flex: 1, padding: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.background, alignItems: 'center',
  },
  modalCancelText: { ...typography.body, color: colors.text.secondary, fontWeight: '600' },
  modalSave: {
    flex: 1, padding: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  modalSaveText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
});

export default FreeWorkoutBuilderScreen;

