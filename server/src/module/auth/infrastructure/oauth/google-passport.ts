import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';

let googleStrategyRegistered = false;

export function registerGooglePassportStrategy(params: {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}) {
  if (googleStrategyRegistered) return;

  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: params.clientId,
        clientSecret: params.clientSecret,
        callbackURL: params.callbackUrl,
      },
      async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
        // Business logic is handled in controller/usecase after callback.
        done(null, profile);
      },
    ),
  );

  googleStrategyRegistered = true;
}

export { passport };
