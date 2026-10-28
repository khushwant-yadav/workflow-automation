import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zioHelpAuth } from '../common/auth';

export const emailProcessAction = createAction({
  auth: zioHelpAuth,
  name: 'email_process',
  displayName: 'Process Incoming Email',
  description:
    'Analyzes an incoming email and decides whether it is a reply to an existing ticket (adds a comment), a duplicate, from an unregistered sender, or a genuinely new issue that requires creating a ticket.',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Email body/content',
      required: true,
    }),
    fromEmail: Property.ShortText({
      displayName: 'From Email',
      description: "Sender's email address",
      required: true,
    }),
    messageId: Property.ShortText({
      displayName: 'Message-ID',
      description: "The email's own Message-ID header",
      required: false,
    }),
    inReplyTo: Property.ShortText({
      displayName: 'In-Reply-To',
      description: 'Raw In-Reply-To header value, if present',
      required: false,
    }),
    references: Property.ShortText({
      displayName: 'References',
      description: 'Raw References header value, if present',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const auth = context.auth;

    const response = await httpClient.sendRequest<unknown>({
      method: HttpMethod.POST,
      url: `${auth.props.baseUrl}/api/email/process`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.access_token}`,
      },
      body: {
        subject: props.subject,
        body: props.body,
        fromEmail: props.fromEmail,
        messageId: props.messageId,
        inReplyTo: props.inReplyTo,
        references: props.references,
      },
    });

    return response.body;
  },
});