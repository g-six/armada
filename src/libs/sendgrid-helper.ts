import sendgrid from '@sendgrid/client'
import { config } from 'generics/config'

sendgrid.setApiKey(config.ARMADA_SENDGRID_API_KEY)
const from = 'no-reply@mail.50stacksofgrey.com'
const from_name = 'Gerard Rey'

export async function sendTemplate(
    template_id: string,
    subject: string,
    to: { name?: string, email: string },
    text: string,
    dynamic_template_data: Record<string, string>,
    bcc: { name?: string, email: string }[] = []
) {
    try {
        const response = await sendgrid.request({
            method: 'POST',
            url: '/v3/mail/send',
            body: {
                from: { email: from, name: from_name },
                personalizations: [{
                    to: [to],
                    bcc: bcc.concat([{ email: 'gerard+50stacksofgrey@echiverri.net' }]),
                    dynamic_template_data: {
                        ...dynamic_template_data,
                        subject,
                    },
                    subject,
                }],
                template_id,
                subject,
                asm: {
                    group_id: 21769,
                    groups_to_display: [21769],
                }
            },
            headers: {
                subject,
            },
        })
        console.log(response, subject)
    } catch (e) {
        console.log(JSON.stringify(e, null, 2))
    }

}
