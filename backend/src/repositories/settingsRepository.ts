import { Settings, type ISettings } from '../models/Settings.js';
import { DEFAULT_CALIBRATION } from '../types/index.js';
import type { CalibrationSettings } from '../types/index.js';
import type { DefaultSheetBehavior } from '../models/Settings.js';

export interface ShopSettingsDto {
  brandName: string;
  logoUrl?: string;
  defaultTemplateId?: string;
  defaultLayoutId?: string;
  defaultSheetBehavior: DefaultSheetBehavior;
}

export class SettingsRepository {
  private async ensureGlobal(): Promise<ISettings> {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) {
      settings = await Settings.create({
        key: 'global',
        calibration: { ...DEFAULT_CALIBRATION },
        shop: { brandName: '', defaultSheetBehavior: 'newSheet' },
        adminPassword: '',
      });
    }
    return settings;
  }

  async getCalibration(): Promise<CalibrationSettings> {
    const settings = await this.ensureGlobal();
    return settings.calibration;
  }

  async updateCalibration(calibration: Partial<CalibrationSettings>): Promise<CalibrationSettings> {
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: { calibration } },
      { new: true, upsert: true, runValidators: true }
    );
    return settings!.calibration;
  }

  async getShop(): Promise<ShopSettingsDto> {
    const settings = await this.ensureGlobal();
    return {
      brandName: settings.shop?.brandName ?? '',
      logoUrl: settings.shop?.logoUrl ?? '',
      defaultTemplateId: settings.shop?.defaultTemplateId?.toString(),
      defaultLayoutId: settings.shop?.defaultLayoutId?.toString(),
      defaultSheetBehavior: settings.shop?.defaultSheetBehavior ?? 'newSheet',
    };
  }

  async updateShop(shop: Partial<ShopSettingsDto>): Promise<ShopSettingsDto> {
    await this.ensureGlobal();
    const update: Record<string, unknown> = {};
    if (shop.brandName !== undefined) update['shop.brandName'] = shop.brandName;
    if (shop.logoUrl !== undefined) update['shop.logoUrl'] = shop.logoUrl;
    if (shop.defaultTemplateId !== undefined) {
      update['shop.defaultTemplateId'] = shop.defaultTemplateId || null;
    }
    if (shop.defaultLayoutId !== undefined) {
      update['shop.defaultLayoutId'] = shop.defaultLayoutId || null;
    }
    if (shop.defaultSheetBehavior !== undefined) {
      update['shop.defaultSheetBehavior'] = shop.defaultSheetBehavior;
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );
    return {
      brandName: settings!.shop?.brandName ?? '',
      logoUrl: settings!.shop?.logoUrl ?? '',
      defaultTemplateId: settings!.shop?.defaultTemplateId?.toString(),
      defaultLayoutId: settings!.shop?.defaultLayoutId?.toString(),
      defaultSheetBehavior: settings!.shop?.defaultSheetBehavior ?? 'newSheet',
    };
  }

  async isAdminPasswordSet(): Promise<boolean> {
    const settings = await this.ensureGlobal();
    return Boolean(settings.adminPassword && settings.adminPassword.length >= 4);
  }

  async setupAdminPassword(password: string): Promise<boolean> {
    const settings = await this.ensureGlobal();
    if (settings.adminPassword && settings.adminPassword.length >= 4) {
      return false;
    }
    await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: { adminPassword: password } },
      { upsert: true }
    );
    return true;
  }

  async verifyAdminPassword(password: string): Promise<boolean> {
    const settings = await this.ensureGlobal();
    if (!settings.adminPassword) return false;
    return settings.adminPassword === password;
  }

  async updateAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const valid = await this.verifyAdminPassword(currentPassword);
    if (!valid) return false;
    await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: { adminPassword: newPassword } },
      { upsert: true }
    );
    return true;
  }

  async getGlobal(): Promise<ISettings> {
    return this.ensureGlobal();
  }
}

export const settingsRepository = new SettingsRepository();
