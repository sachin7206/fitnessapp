package com.fitnessapp.progress.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class TrendDataDTO {
    private List<TrendPoint> weightTrend;
    private List<TrendPoint> bmiTrend;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TrendPoint {
        private LocalDate date;
        private Double value;
    }
}

