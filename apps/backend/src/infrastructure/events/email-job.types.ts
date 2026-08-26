export interface EmailJob {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
}
