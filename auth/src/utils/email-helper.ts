// eslint-disable-next-line
const Mailchimp = require('@mailchimp/mailchimp_transactional')
/**
 * Validate email address
 */
const validateEmailAddress = (email: string): boolean => {
    const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(email).toLowerCase())
}

const mailchimp = Mailchimp(process.env.MANDRILL_API_KEY, true)
const from_email = 'gerard+vacan@idearobin.com'
const from_name = 'IdeaRobin'
const merge_language = 'handlebars'
const mandrill = mailchimp.messages

interface Receipient {
    email: string
    name: string
}

interface MergeVars {
    name: string
    content: string
}

interface TemplateOptions {
    template_name: string
    bcc_address: string
    to: Receipient[]
    subject: string
    to_name: string
    send_at?: number
    attachments?: string[]
    merge_vars?: MergeVars[]
}

type MandrillResponse = {
    [key: string]: string | number | TemplateOptions
}
const sendTemplate = async (
    opts: TemplateOptions
): Promise<MandrillResponse | MandrillResponse> => {
    const {
        attachments,
        merge_vars,
        send_at,
        subject,
        template_name,
        to,
        to_name,
    } = opts
    if (process.env.NODE_ENV == 'local') {
        return { opts }
    }
    return await mandrill.sendTemplate({
        template_name,
        template_content: [
            {
                name: 'subject',
                content: subject,
            },
        ],
        message: {
            bcc_address: 'gerard+edujourney@idearobin.com',
            to,
            from_name,
            from_email,
            merge_language,
            global_merge_vars: [
                {
                    name: 'subject',
                    content: subject,
                },
                {
                    name: 'to_name',
                    content: to_name,
                },
            ].concat(merge_vars),
            attachments,
        },
        send_at: send_at || new Date(),
    })
}

export {
    sendTemplate,
    validateEmailAddress,
    Receipient,
    TemplateOptions,
}
