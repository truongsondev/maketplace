ALTER TABLE `users`
  DROP COLUMN `phone_verified`;

ALTER TABLE `user_roles`
  DROP COLUMN `assigned_at`;

ALTER TABLE `discount_usages`
  DROP COLUMN `used_at`;
