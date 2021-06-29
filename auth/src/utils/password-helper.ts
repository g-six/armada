const validatePassword = (key: string): boolean => {
    return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}/.test(key)
}

export { validatePassword }
