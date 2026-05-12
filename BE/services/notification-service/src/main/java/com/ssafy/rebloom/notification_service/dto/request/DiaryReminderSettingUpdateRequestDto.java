package com.ssafy.rebloom.notification_service.dto.request;

import com.ssafy.rebloom.notification_service.domain.enums.ScheduleDay;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import java.util.List;

public record DiaryReminderSettingUpdateRequestDto (
    @NotNull
    Boolean isEnabled,

    @NotNull
    List<ScheduleDay> days,

    @NotNull
    List<LocalTime> times
){

}
