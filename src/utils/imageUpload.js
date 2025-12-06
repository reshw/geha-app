/**
 * Cloudinary 이미지 업로드 유틸리티
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * 이미지를 Cloudinary에 업로드
 * @param {File} file - 업로드할 이미지 파일
 * @param {string} spaceId - 스페이스 ID (폴더 구조용)
 * @returns {Promise<string>} - 업로드된 이미지 URL
 */
export const uploadImage = async (file, spaceId) => {
  try {
    console.log('📤 이미지 업로드 시작:', file.name);
    
    // FormData 생성
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `spaces/${spaceId}/expenses`);
    
    // Cloudinary API 호출
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('이미지 업로드 실패');
    }
    
    const data = await response.json();
    console.log('✅ 이미지 업로드 성공:', data.secure_url);
    
    return data.secure_url;
  } catch (error) {
    console.error('❌ 이미지 업로드 실패:', error);
    throw error;
  }
};

/**
 * 여러 이미지를 동시에 업로드
 * @param {File[]} files - 업로드할 이미지 파일 배열
 * @param {string} spaceId - 스페이스 ID
 * @returns {Promise<string[]>} - 업로드된 이미지 URL 배열
 */
export const uploadMultipleImages = async (files, spaceId) => {
  try {
    console.log('📤 다중 이미지 업로드 시작:', files.length);
    
    const uploadPromises = files.map(file => uploadImage(file, spaceId));
    const urls = await Promise.all(uploadPromises);
    
    console.log('✅ 다중 이미지 업로드 완료:', urls.length);
    return urls;
  } catch (error) {
    console.error('❌ 다중 이미지 업로드 실패:', error);
    throw error;
  }
};

/**
 * 이미지 파일 유효성 검사
 * @param {File} file - 검사할 파일
 * @param {number} maxSizeMB - 최대 파일 크기 (MB)
 * @returns {boolean} - 유효성 검사 통과 여부
 */
export const validateImage = (file, maxSizeMB = 5) => {
  // 파일 타입 검사
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('JPG, PNG, GIF, WEBP 형식만 업로드 가능합니다.');
  }
  
  // 파일 크기 검사
  const maxSize = maxSizeMB * 1024 * 1024; // MB to bytes
  if (file.size > maxSize) {
    throw new Error(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
  }
  
  return true;
};

/**
 * 이미지 미리보기 URL 생성
 * @param {File} file - 미리보기할 파일
 * @returns {string} - 미리보기 URL
 */
export const createPreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * 미리보기 URL 해제 (메모리 정리)
 * @param {string} url - 해제할 URL
 */
export const revokePreviewUrl = (url) => {
  URL.revokeObjectURL(url);
};