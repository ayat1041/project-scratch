export interface PasswordRequirementStatus {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
    noSpaces: boolean;
}

export function getPasswordRequirementStatus(
    password: string,
): PasswordRequirementStatus {
    return {
        minLength: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#"?$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
        noSpaces: !/\s/.test(password),
    };
}

export function isPasswordValid(password: string): boolean {
    const status = getPasswordRequirementStatus(password);
    return (
        status.minLength &&
        status.uppercase &&
        status.lowercase &&
        status.number &&
        status.symbol &&
        status.noSpaces
    );
}
