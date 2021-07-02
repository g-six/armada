const validatePassword = (key: string): boolean => {
    return /^[a-zA-Z0-9]{8,20}/i.test(key)
}

export { validatePassword }
