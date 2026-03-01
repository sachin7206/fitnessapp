package com.fitnessapp.wellness.impl.service;

import com.fitnessapp.wellness.impl.model.*;
import com.fitnessapp.wellness.impl.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component @RequiredArgsConstructor @Slf4j
public class WellnessDataInitializer implements CommandLineRunner {
    private final YogaPoseRepository poseRepo;
    private final MeditationSessionRepository meditationRepo;
    private final BreathingExerciseRepository breathingRepo;
    private final WellnessTipRepository tipRepo;

    @Override
    public void run(String... args) {
        if (poseRepo.count() == 0) seedYogaPoses();
        if (meditationRepo.count() == 0) seedMeditations();
        if (breathingRepo.count() == 0) seedBreathingExercises();
        if (tipRepo.count() == 0) seedTips();
    }

    private void seedYogaPoses() {
        log.info("Seeding yoga poses...");
        String[][] poses = {
            {"Mountain Pose", "Tadasana", "Foundation standing pose for alignment", "Improves posture, strengthens thighs", "BEGINNER", "30", "STANDING", "Stand tall, feet together, arms at sides. Distribute weight evenly."},
            {"Downward Dog", "Adho Mukha Svanasana", "Inverted V-shape stretch", "Stretches hamstrings, calves, shoulders", "BEGINNER", "45", "INVERSION", "Form inverted V, hands shoulder-width, feet hip-width apart."},
            {"Warrior I", "Virabhadrasana I", "Standing lunge with arms overhead", "Strengthens legs, opens hips and chest", "BEGINNER", "30", "STANDING", "Step one foot back, bend front knee 90°, arms overhead."},
            {"Warrior II", "Virabhadrasana II", "Wide stance with arms extended", "Builds stamina, strengthens legs", "BEGINNER", "30", "STANDING", "Wide stance, front knee over ankle, arms parallel to floor."},
            {"Tree Pose", "Vrikshasana", "Single-leg balance pose", "Improves balance and focus", "BEGINNER", "30", "BALANCE", "Stand on one leg, place other foot on inner thigh, hands in prayer."},
            {"Child's Pose", "Balasana", "Resting pose with forehead on floor", "Relieves stress, stretches back", "BEGINNER", "60", "RESTING", "Kneel, sit back on heels, fold forward with arms extended."},
            {"Cobra Pose", "Bhujangasana", "Prone backbend with chest lifted", "Strengthens spine, opens chest", "BEGINNER", "30", "BACKBEND", "Lie prone, hands under shoulders, lift chest keeping hips grounded."},
            {"Triangle Pose", "Trikonasana", "Wide-legged side bend", "Stretches sides, strengthens legs", "INTERMEDIATE", "30", "STANDING", "Wide stance, reach one hand to ankle, other arm to sky."},
            {"Crow Pose", "Bakasana", "Arm balance with knees on triceps", "Builds arm strength, improves balance", "ADVANCED", "20", "ARM_BALANCE", "Squat, place hands on floor, lean forward, lift feet."},
            {"Headstand", "Sirsasana", "Inverted pose on head and forearms", "Improves circulation, builds core", "ADVANCED", "60", "INVERSION", "Interlace fingers, place head on floor, walk feet in, lift legs."},
            {"Pigeon Pose", "Kapotasana", "Deep hip opener", "Opens hips, releases stored tension", "INTERMEDIATE", "45", "HIP_OPENER", "From downward dog, bring one knee forward, extend other leg back."},
            {"Boat Pose", "Navasana", "V-shape balance on sit bones", "Strengthens core and hip flexors", "INTERMEDIATE", "30", "CORE", "Sit, lean back, lift legs to 45°, arms parallel to floor."},
        };
        for (String[] p : poses) {
            YogaPose pose = new YogaPose();
            pose.setName(p[0]); pose.setSanskritName(p[1]); pose.setDescription(p[2]); pose.setBenefits(p[3]);
            pose.setDifficulty(p[4]); pose.setDurationSeconds(Integer.parseInt(p[5])); pose.setCategory(p[6]); pose.setInstructions(p[7]);
            poseRepo.save(pose);
        }
        log.info("Seeded {} yoga poses", poses.length);
    }

    private void seedMeditations() {
        log.info("Seeding meditation sessions...");
        String[][] meds = {
            {"Mindful Morning", "GUIDED", "10", "Start your day with awareness and intention", "BEGINNER", "Reduces morning anxiety, sets positive tone for the day"},
            {"Body Scan Relaxation", "GUIDED", "15", "Progressive body awareness from head to toe", "BEGINNER", "Reduces physical tension, improves body awareness"},
            {"Deep Focus", "FOCUS", "20", "Concentration meditation for productivity", "INTERMEDIATE", "Enhances focus, improves cognitive performance"},
            {"Stress Dissolve", "STRESS_RELIEF", "15", "Release accumulated stress and tension", "BEGINNER", "Lowers cortisol, promotes relaxation"},
            {"Sleep Journey", "SLEEP", "25", "Guided visualization for peaceful sleep", "BEGINNER", "Improves sleep quality, reduces insomnia"},
            {"Loving Kindness", "GUIDED", "15", "Cultivate compassion for self and others", "INTERMEDIATE", "Increases empathy, reduces negative self-talk"},
            {"Zen Silence", "UNGUIDED", "20", "Unguided meditation with gentle bells", "ADVANCED", "Deepens meditation practice, enhances inner peace"},
            {"Chakra Healing", "GUIDED", "30", "Energy center balancing meditation", "INTERMEDIATE", "Balances energy, promotes emotional healing"},
        };
        for (String[] m : meds) {
            MeditationSession s = new MeditationSession();
            s.setName(m[0]); s.setType(m[1]); s.setDurationMinutes(Integer.parseInt(m[2]));
            s.setDescription(m[3]); s.setDifficulty(m[4]); s.setBenefits(m[5]);
            meditationRepo.save(s);
        }
        log.info("Seeded {} meditation sessions", meds.length);
    }

    private void seedBreathingExercises() {
        log.info("Seeding breathing exercises...");
        String[][] exs = {
            {"Box Breathing", "BOX", "4-4-4-4", "5", "Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat.", "Calms nervous system, reduces anxiety", "BEGINNER"},
            {"4-7-8 Relaxation", "RELAXATION", "4-7-8", "5", "Inhale 4s, hold 7s, exhale 8s. Repeat.", "Promotes sleep, reduces stress", "BEGINNER"},
            {"Kapalbhati", "PRANAYAMA", "rapid exhale", "10", "Short forceful exhales with passive inhales. 30 rounds per set.", "Cleanses lungs, energizes body, aids digestion", "INTERMEDIATE"},
            {"Anulom Vilom", "PRANAYAMA", "alternate nostril", "10", "Alternate nostril breathing. Inhale left, exhale right, repeat.", "Balances brain hemispheres, calms mind", "BEGINNER"},
            {"Bhramari", "PRANAYAMA", "humming bee", "5", "Inhale deeply, exhale with humming sound. Cover ears gently.", "Relieves tension headaches, calms anger", "BEGINNER"},
        };
        for (String[] e : exs) {
            BreathingExercise b = new BreathingExercise();
            b.setName(e[0]); b.setTechnique(e[1]); b.setPattern(e[2]); b.setDurationMinutes(Integer.parseInt(e[3]));
            b.setDescription(e[4]); b.setBenefits(e[5]); b.setDifficulty(e[6]);
            breathingRepo.save(b);
        }
        log.info("Seeded {} breathing exercises", exs.length);
    }

    private void seedTips() {
        log.info("Seeding wellness tips...");
        String[] tips = {
            "Start your morning with 5 deep breaths before checking your phone. 🌅",
            "Drink a glass of warm water with lemon first thing in the morning. 🍋",
            "Practice gratitude — write down 3 things you're grateful for today. 🙏",
            "Take a 5-minute stretching break every hour while working. 🧘",
            "Try the 4-7-8 breathing technique before bed for better sleep. 😴",
            "Spend 10 minutes in sunlight each morning for vitamin D and mood. ☀️",
            "Practice mindful eating — eat without screens for one meal today. 🍽️",
            "Do a body scan meditation before sleep to release tension. 🛏️",
            "Walk barefoot on grass for 10 minutes — it's grounding. 🌿",
            "Replace one caffeinated drink with herbal tea today. 🍵",
            "Practice box breathing for 2 minutes when feeling stressed. 📦",
            "Set a daily intention each morning. What matters most today? 🎯",
            "Do 5 sun salutations to energize your body and mind. 🌞",
            "Practice digital detox for 1 hour before bedtime. 📱",
            "Listen to calming music during your commute or break. 🎵",
            "Sit in silence for 5 minutes. Let your thoughts pass like clouds. ☁️",
            "Stretch your hip flexors if you sit for long hours. 🦵",
            "Practice Anulom Vilom for 5 minutes to balance your energy. 🌬️",
            "Smile at yourself in the mirror. Self-compassion matters. 😊",
            "End your shower with 30 seconds of cold water for alertness. 🚿",
            "Do a 10-minute guided meditation during your lunch break. 🧘‍♀️",
            "Practice progressive muscle relaxation before a stressful event. 💪",
            "Write in a journal for 5 minutes before bed. 📝",
            "Try a new yoga pose today, even if it's imperfect. 🤸",
            "Take 3 conscious breaths before each meal. 🌬️",
            "Practice non-judgment — observe without labeling good or bad. 👁️",
            "Do neck and shoulder rolls every 2 hours while at a desk. 🔄",
            "Spend 5 minutes doing Kapalbhati for digestive health. 🫁",
            "Tell someone you appreciate them today. Connection heals. ❤️",
            "Before bed, mentally release one thing that bothered you today. 🕊️",
        };
        for (int i = 0; i < tips.length; i++) {
            WellnessTip tip = new WellnessTip();
            tip.setContent(tips[i]);
            tip.setCategory(i % 3 == 0 ? "MINDFULNESS" : i % 3 == 1 ? "BREATHING" : "LIFESTYLE");
            tip.setDayNumber(i + 1);
            tipRepo.save(tip);
        }
        log.info("Seeded {} wellness tips", tips.length);
    }
}

