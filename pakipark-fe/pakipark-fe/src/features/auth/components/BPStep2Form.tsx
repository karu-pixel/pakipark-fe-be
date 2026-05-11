import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { loginColors, loginShadows } from './LoginStyles';

export type PartnerUploadKey = 'permit' | 'registration' | 'ownership';

export interface PartnerUploadFile {
  name: string;
  uri: string;
  mimeType?: string | null;
  size?: number | null;
}

export type PartnerUploads = Record<PartnerUploadKey, PartnerUploadFile | null>;

const uploads = [
  { key: 'permit', title: 'Business Permit', desc: 'Current LGU permit', icon: 'upload' },
  { key: 'registration', title: 'DTI or SEC Cert', desc: 'Registration doc', icon: 'file-text' },
  { key: 'ownership', title: 'Proof of Ownership', desc: 'Deed or lease', icon: 'camera' },
] as const satisfies readonly {
  key: PartnerUploadKey;
  title: string;
  desc: string;
  icon: 'upload' | 'file-text' | 'camera';
}[];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];

const getFileExtension = (fileName: string) => {
  const normalized = fileName.trim().toLowerCase();
  const extensionIndex = normalized.lastIndexOf('.');
  return extensionIndex >= 0 ? normalized.slice(extensionIndex) : '';
};

const truncateFileName = (fileName: string) => {
  if (fileName.length <= 34) {
    return fileName;
  }

  const extension = getFileExtension(fileName);
  const baseName = extension ? fileName.slice(0, -extension.length) : fileName;
  return `${baseName.slice(0, 24)}...${extension}`;
};

const validatePickedAsset = (asset: DocumentPicker.DocumentPickerAsset) => {
  const extension = getFileExtension(asset.name ?? '');
  const hasAllowedExtension = allowedExtensions.includes(extension);
  const hasAllowedMimeType = typeof asset.mimeType === 'string' && allowedMimeTypes.includes(asset.mimeType);

  if (!hasAllowedExtension && !hasAllowedMimeType) {
    return 'Upload a JPG, JPEG, PNG, or PDF file only.';
  }

  if (typeof asset.size === 'number' && asset.size > MAX_UPLOAD_BYTES) {
    return 'Each file must be 5 MB or smaller.';
  }

  return '';
};

export function BPStep2Form({
  uploads: uploadFiles,
  setUploads,
  onSubmit,
  onBack,
}: {
  uploads: PartnerUploads;
  setUploads: Dispatch<SetStateAction<PartnerUploads>>;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<PartnerUploadKey, string>>>({});

  const handlePickDocument = async (uploadKey: PartnerUploadKey) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        type: allowedMimeTypes,
        copyToCacheDirectory: false,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const validationError = validatePickedAsset(asset);

      if (validationError) {
        setErrors((current) => ({ ...current, [uploadKey]: validationError }));
        Alert.alert('Unsupported file', validationError);
        return;
      }

      setUploads((current) => ({
        ...current,
        [uploadKey]: {
          name: asset.name || 'Selected file',
          uri: asset.uri,
          mimeType: asset.mimeType ?? null,
          size: asset.size ?? null,
        },
      }));
      setErrors((current) => ({ ...current, [uploadKey]: '' }));
    } catch {
      Alert.alert('Upload failed', 'We could not access your file. Please try again.');
    }
  };

  const handleSubmit = () => {
    const nextErrors: Partial<Record<PartnerUploadKey, string>> = {};

    uploads.forEach((upload) => {
      if (!uploadFiles[upload.key]) {
        nextErrors[upload.key] = 'This document is required.';
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit();
  };

  return (
    <View style={styles.root}>
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <Feather name="check-circle" size={16} color="#10B981" />
          <Text style={styles.bannerTitle}>Requirements</Text>
          <Text style={styles.bannerTag}>Max 5MB</Text>
        </View>
        <View style={styles.requirementList}>
          <Text style={styles.bannerCopy}>- Valid Business Permit</Text>
          <Text style={styles.bannerCopy}>- DTI or SEC Certificate</Text>
          <Text style={styles.bannerCopy}>- Proof of ownership or lease agreement</Text>
        </View>
        <Text style={styles.helperText}>Accepted formats: JPG, JPEG, PNG, PDF</Text>
      </View>

      <View style={styles.uploadList}>
        {uploads.map((upload) => (
          <View key={upload.key} style={styles.uploadItem}>
            <Pressable
              style={[
                styles.uploadCard,
                uploadFiles[upload.key] ? styles.uploadCardReady : undefined,
                errors[upload.key] ? styles.uploadCardError : undefined,
              ]}
              onPress={() => {
                void handlePickDocument(upload.key);
              }}
            >
              <View style={[styles.uploadIcon, uploadFiles[upload.key] ? styles.uploadIconReady : undefined]}>
                <Feather
                  name={(uploadFiles[upload.key] ? 'check' : upload.icon) as never}
                  size={15}
                  color={uploadFiles[upload.key] ? '#0F9D64' : '#9AAABD'}
                />
              </View>
              <View style={styles.uploadCopy}>
                <Text style={styles.uploadTitle} numberOfLines={1}>
                  {uploadFiles[upload.key] ? truncateFileName(uploadFiles[upload.key]?.name ?? upload.title) : upload.title}
                </Text>
                <Text style={[styles.uploadDesc, uploadFiles[upload.key] ? styles.uploadDescReady : undefined]}>
                  {uploadFiles[upload.key] ? 'Tap to replace' : upload.desc}
                </Text>
              </View>
            </Pressable>
            {!!errors[upload.key] && <Text style={styles.errorText}>{errors[upload.key]}</Text>}
          </View>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Feather name="arrow-left" size={16} color="#8492A6" />
        </Pressable>
        <Pressable style={[styles.primaryButton, loginShadows.button]} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>Submit Application</Text>
          <Feather name="arrow-right" size={15} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  banner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFE6D4',
    backgroundColor: '#F0FDF8',
    padding: 14,
    gap: 7,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '700',
  },
  bannerTag: {
    marginLeft: 'auto',
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  requirementList: {
    gap: 4,
  },
  bannerCopy: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '600',
  },
  helperText: {
    color: '#16A26C',
    fontSize: 10,
    fontWeight: '700',
  },
  uploadList: {
    gap: 8,
  },
  uploadItem: {
    gap: 4,
  },
  uploadCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D7E1EC',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  uploadCardReady: {
    borderStyle: 'solid',
    borderColor: '#82E0B8',
    backgroundColor: '#F3FFF8',
  },
  uploadCardError: {
    borderColor: '#E37A7A',
  },
  uploadIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconReady: {
    borderColor: '#C4EED9',
    backgroundColor: '#E8FFF3',
  },
  uploadCopy: {
    flex: 1,
    gap: 1,
    justifyContent: 'center',
  },
  uploadTitle: {
    color: loginColors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  uploadDesc: {
    color: '#8A9AAF',
    fontSize: 10,
  },
  uploadDescReady: {
    color: '#0F9D64',
    fontWeight: '700',
  },
  errorText: {
    color: loginColors.danger,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  backButton: {
    width: 44,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#DDE5EE',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#EE6B20',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
