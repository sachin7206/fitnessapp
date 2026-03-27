package com.fitnessapp.progress.impl.validation;

import org.springframework.stereotype.Component;

/**
 * Centralized validation logic for progress tracking operations.
 */
@Component
public class ProgressValidator {

    /**
     * Validate and clamp the days parameter to a reasonable range.
     */
    public int validateDaysRange(int days, int min, int max) {
        if (days < min) return min;
        if (days > max) return max;
        return days;
    }

    /**
     * Validate that a weight value is in a reasonable range.
     */
    public void validateWeight(Double weight) {
        if (weight != null && (weight < 0 || weight > 1000)) {
            throw new IllegalArgumentException("Weight must be between 0 and 1000 kg");
        }
    }

    /**
     * Validate that a BMI value is in a reasonable range.
     */
    public void validateBmi(Double bmi) {
        if (bmi != null && (bmi < 0 || bmi > 200)) {
            throw new IllegalArgumentException("BMI value is out of reasonable range");
        }
    }
}

