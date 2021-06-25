import { genSaltSync, hashSync, compareSync } from 'bcryptjs'

/**
 * Hash password
 * @param {*} user
 */
const hashPassword = (password: string): string => {
    const salt = genSaltSync(10)
    return hashSync(password, salt)
}

/**
 * Compare password
 */
const comparePassword = (
    inputed: string,
    expected: string
): boolean => {
    return compareSync(inputed, expected)
}

export { hashPassword, comparePassword }
