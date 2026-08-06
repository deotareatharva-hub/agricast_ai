import { body } from "express-validator";

// express-validator chains for each auth endpoint. Kept separate from the
// route file so validation rules are easy to find, test, and reuse.
export const registerValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Full name must be between 2 and 150 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

export const googleLoginValidation = [
  body("credential")
    .notEmpty()
    .withMessage("Google credential is required")
    .isString()
    .withMessage("Google credential must be a string"),
];
