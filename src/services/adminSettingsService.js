// src/services/adminSettingsService.js
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 어드민 설정 서비스
 */
const adminSettingsService = {
  /**
   * 슈퍼어드민 이메일 설정 조회
   */
  async getAdminEmailSettings() {
    try {
      const settingsRef = doc(db, 'admin_settings', 'email_notifications');
      const settingsDoc = await getDoc(settingsRef);

      if (!settingsDoc.exists()) {
        // 기본값 반환
        return {
          adminEmail: '',
          spaceCreationNotifications: true,
          alimtalkNotifications: true
        };
      }

      return settingsDoc.data();
    } catch (error) {
      console.error('❌ 어드민 이메일 설정 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 슈퍼어드민 이메일 설정 업데이트
   */
  async updateAdminEmailSettings(settings) {
    try {
      console.log('💾 어드민 이메일 설정 업데이트:', settings);

      const settingsRef = doc(db, 'admin_settings', 'email_notifications');

      const updateData = {
        ...settings,
        updatedAt: new Date()
      };

      await setDoc(settingsRef, updateData, { merge: true });

      console.log('✅ 어드민 이메일 설정 업데이트 완료');

      return { success: true };
    } catch (error) {
      console.error('❌ 어드민 이메일 설정 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 슈퍼어드민 이메일로 알림 발송
   */
  async sendAdminNotification(type, data) {
    try {
      // 어드민 이메일 설정 조회
      const settings = await this.getAdminEmailSettings();

      if (!settings.adminEmail) {
        console.warn('⚠️ 어드민 이메일이 설정되지 않았습니다.');
        return { success: false, message: '어드민 이메일이 설정되지 않았습니다.' };
      }

      // 알림 타입별 활성화 체크
      if (type === 'space_creation_request' && !settings.spaceCreationNotifications) {
        console.log('ℹ️ 방 생성 알림이 비활성화되어 있습니다.');
        return { success: false, message: '방 생성 알림이 비활성화되어 있습니다.' };
      }

      // 서버리스 함수 호출
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          ...data,
          recipients: {
            to: settings.adminEmail
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`이메일 발송 실패: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ 어드민 알림 이메일 발송 완료:', result);

      return { success: true, result };
    } catch (error) {
      console.error('❌ 어드민 알림 이메일 발송 실패:', error);
      // 이메일 발송 실패는 전체 프로세스를 중단하지 않음
      return { success: false, error: error.message };
    }
  }
};

export default adminSettingsService;
