package com.flexpol.backend.entity;

/** Safe public reasons; exception details and secret market inputs stay on the server. */
public enum DuelFailureReason {
	EVALUATION_ERROR, EVALUATION_TIMEOUT
}
