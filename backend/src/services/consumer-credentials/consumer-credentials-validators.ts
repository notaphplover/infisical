import { z } from "zod";

// Not the best Regex but good enough for demo purposes
export const cardNumberRegex = /^([0-9]){12,20}$/;

export const cvvRegex = /^([0-9]){3,4}$/;

export const validateCardNumberField = z
  .string()
  .trim()
  .refine((data) => cardNumberRegex.test(data), {
    message: "The card number must be a valid card number"
  });

export const validateCvvField = z
  .string()
  .trim()
  .refine((data) => cvvRegex.test(data), {
    message: "The cvv must be a valid card cvv"
  });
