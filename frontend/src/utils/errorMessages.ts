/** User-friendly Japanese error messages (no technical details). */
export const ERROR_MESSAGES = {
  create: '登録に失敗しました。もう一度お試しください。',
  update: '更新に失敗しました。もう一度お試しください。',
  delete: '削除に失敗しました。もう一度お試しください。',
  login: 'ログインに失敗しました。メールアドレスとパスワードをご確認ください。',
  load: '読み込みに失敗しました。もう一度お試しください。',
  change: '変更に失敗しました。もう一度お試しください。',
  network: '通信エラーが発生しました。しばらくしてからお試しください。',
  invalidInput: '入力内容をご確認ください。',
  deactivate: '無効化に失敗しました。もう一度お試しください。',
} as const;
