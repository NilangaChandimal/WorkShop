<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Business-rule rejection for bookings. Rendered as 422 with a machine-readable error code
 * so the frontend can distinguish "fully booked" from other failures.
 */
class RegistrationException extends Exception
{
    public function __construct(string $message, private readonly string $errorCode)
    {
        parent::__construct($message, Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    public static function capacityExceeded(): self
    {
        return new self('Sorry, this workshop is fully booked. The last seat has already been taken.', 'capacity_exceeded');
    }

    public static function workshopNotOpen(): self
    {
        return new self('This workshop is not open for registration.', 'workshop_not_open');
    }

    public static function workshopStarted(): self
    {
        return new self('This workshop has already started, so new registrations are closed.', 'workshop_started');
    }

    public static function duplicate(): self
    {
        return new self('This attendee is already registered for this workshop.', 'duplicate_registration');
    }

    public static function alreadyCancelled(): self
    {
        return new self('This registration has already been cancelled.', 'already_cancelled');
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error' => $this->errorCode,
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
