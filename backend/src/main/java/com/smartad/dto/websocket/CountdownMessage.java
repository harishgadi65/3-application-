package com.smartad.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Broadcast on {@code /topic/session/{code}/countdown} once per second
 * during the pre-game countdown.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CountdownMessage {

    private int seconds;
}
