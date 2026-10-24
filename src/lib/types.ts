export interface Attachment {
  id: string;
  name: string;
  text: string;
}

export interface SendMeta {
  display?: string;
  title?: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  actionLabel?: string;
  action?: () => void;
}
