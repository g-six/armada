const validatePassword = (key: string): boolean => {
    return /^.*(?=.{8,20})(?=.*[a-zA-Z])(?=.*\d).*$/.test(key)
}

export { validatePassword }
