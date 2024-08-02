export interface ZAPI {
  isStatusReply: boolean;
  chatLid: string;
  connectedPhone: string;
  waitingMessage: boolean;
  isEdit: boolean;
  isGroup: boolean;
  isNewsletter: boolean;
  instanceId: string;
  messageId: string;
  phone: string;
  fromMe: boolean;
  momment: number;
  status: string;
  chatName: string;
  senderPhoto: null;
  senderName: string;
  photo: string;
  broadcast: boolean;
  participantLid: null;
  messageExpirationSeconds: number;
  forwarded: boolean;
  type: string;
  fromApi: boolean;
  text: Text;
}

export interface Text {
  message: string;
}
