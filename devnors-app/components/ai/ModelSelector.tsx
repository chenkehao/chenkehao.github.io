/**
 * AI 模型选择器组件
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AI_MODELS } from '../../shared/types';
import type { AccountTier } from '../../shared/types';

interface Props {
  currentModel: string;
  accountTier: AccountTier;
  onSelect: (modelId: string) => void;
}

const TIER_ORDER: AccountTier[] = ['FREE', 'PRO', 'ULTRA'];

export default function ModelSelector({ currentModel, accountTier, onSelect }: Props) {
  const [visible, setVisible] = useState(false);

  const tierIndex = TIER_ORDER.indexOf(accountTier);
  const availableModels = AI_MODELS.filter(
    (m) => TIER_ORDER.indexOf(m.tier) <= tierIndex
  );

  const currentModelObj = AI_MODELS.find((m) => m.id === currentModel) || AI_MODELS[0];

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f1f5f9',
          borderRadius: 16,
          paddingHorizontal: 10,
          paddingVertical: 5,
          gap: 4,
        }}
      >
        <Ionicons name="hardware-chip-outline" size={13} color="#4f46e5" />
        <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500' }}>
          {currentModelObj.name}
        </Text>
        <Ionicons name="chevron-down" size={12} color="#94a3b8" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 20,
              width: '80%',
              maxWidth: 320,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 }}>
              选择 AI 模型
            </Text>

            {AI_MODELS.map((model) => {
              const isAvailable = availableModels.includes(model);
              const isSelected = model.id === currentModel;

              return (
                <TouchableOpacity
                  key={model.id}
                  disabled={!isAvailable}
                  onPress={() => {
                    onSelect(model.id);
                    setVisible(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 6,
                    backgroundColor: isSelected ? '#eef2ff' : isAvailable ? '#fff' : '#f8fafc',
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? '#4f46e5' : '#f1f5f9',
                    opacity: isAvailable ? 1 : 0.5,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: isSelected ? '#4f46e5' : '#f1f5f9',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name="hardware-chip-outline"
                      size={16}
                      color={isSelected ? '#fff' : '#64748b'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: isAvailable ? '#0f172a' : '#94a3b8',
                      }}
                    >
                      {model.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                      {model.tier === 'FREE'
                        ? '免费版'
                        : model.tier === 'PRO'
                        ? '专业版'
                        : '旗舰版'}
                    </Text>
                  </View>
                  {!isAvailable && (
                    <Ionicons name="lock-closed-outline" size={14} color="#94a3b8" />
                  )}
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color="#4f46e5" />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={{
                marginTop: 8,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, color: '#64748b' }}>取消</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
