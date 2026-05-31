import {
  backendApi,
  clearSession,
  getSavedUser,
  saveSession,
  type ApiUser,
} from '../lib/api';

type AppTarget = 'pakipark' | 'pakiship';

type SocialLoginPayload = {
  email: string;
  name: string;
  provider: string;
  providerId?: string;
  profile_picture?: string;
};

export const authService = {
  async login(
    identifier: string,
    password: string,
    app: AppTarget = 'pakipark',
    keepLoggedIn = false,
  ) {
    const user = await backendApi.login(
      identifier,
      password,
      app,
      keepLoggedIn,
    );

    // backendApi.login already saves the session
    // We must not clearSession() here, otherwise the user is immediately logged out!
    await saveSession(user);

    return user;
  },

  async socialLogin(payload: SocialLoginPayload, keepLoggedIn = false) {
    const user = await backendApi.socialLogin(payload);

    // backendApi.socialLogin already saves the session
    await saveSession(user);

    return user;
  },

  async registerCustomer(
    payload: Parameters<typeof backendApi.registerCustomer>[0],
  ) {
    return backendApi.registerCustomer(payload);
  },

  async registerPartner(
    payload: Parameters<typeof backendApi.registerPartner>[0],
  ) {
    return backendApi.registerPartner(payload);
  },

  async me() {
    return backendApi.getMe();
  },

  async forgotPassword(identifier: string) {
    return backendApi.forgotPassword(identifier);
  },

  async verifyResetOtp(identifier: string, otp: string) {
    return backendApi.verifyResetOtp(identifier, otp);
  },

  async resetPassword(resetToken: string, newPassword: string) {
    return backendApi.resetPassword(resetToken, newPassword);
  },

  async saveSession(user: ApiUser) {
    return saveSession(user);
  },

  async getSavedUser() {
    return getSavedUser();
  },

  async restoreSession() {
    const savedUser = await getSavedUser();

    if (!savedUser) {
      return null;
    }

    return savedUser;
  },

  async logout() {
    return clearSession();
  },
};
