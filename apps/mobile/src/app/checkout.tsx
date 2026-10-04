import { formatPrice, isValidPhone, ORDER_TYPE_LABELS, type OrderType } from '@coffee/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { colors, radius, spacing } from '@/constants/theme';
import { usePricedCart } from '@/hooks/use-menu';
import { usePlaceOrder } from '@/hooks/use-orders';
import { useCart } from '@/store/cart';
import { useDevice } from '@/store/device';

const ORDER_TYPES: OrderType[] = ['takeaway', 'dine_in'];

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const cart = usePricedCart();
  const clearCart = useCart((state) => state.clear);
  const { customerName, customerPhone, saveCustomer } = useDevice();
  const placeOrder = usePlaceOrder();

  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [orderType, setOrderType] = useState<OrderType>('takeaway');
  const [note, setNote] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const nameError = name.trim() === '' ? 'Нэрээ оруулна уу' : null;
  const phoneError = !isValidPhone(phone) ? 'Утасны дугаараа зөв оруулна уу (8 оронтой)' : null;

  if (cart.lines.length === 0 && !placeOrder.isPending) {
    return (
      <EmptyState
        emoji="🛍️"
        title="Сагс хоосон байна"
        actionTitle="Цэс үзэх"
        onAction={() => router.navigate('/menu')}
      />
    );
  }

  const submit = () => {
    setShowErrors(true);
    if (nameError || phoneError || cart.hasUnavailable) return;

    placeOrder.mutate(
      {
        customerName: name,
        customerPhone: phone,
        orderType,
        note,
        items: cart.lines.map((line) => ({
          product_id: line.productId,
          size: line.size,
          quantity: line.quantity,
        })),
      },
      {
        onSuccess: (result) => {
          saveCustomer(name.trim(), phone.trim());
          router.replace({ pathname: '/order/[id]', params: { id: result.id, placed: '1' } });
          clearCart();
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Таны мэдээлэл</Text>
        <View style={styles.card}>
          <Field
            label="Нэр"
            value={name}
            onChangeText={setName}
            placeholder="Жишээ: Болд"
            autoComplete="name"
            textContentType="givenName"
            maxLength={60}
            error={showErrors ? nameError : null}
          />
          <Field
            label="Утасны дугаар"
            value={phone}
            onChangeText={setPhone}
            placeholder="9911 2233"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={20}
            error={showErrors ? phoneError : null}
          />
        </View>

        <Text style={styles.sectionTitle}>Захиалгын төрөл</Text>
        <View style={styles.segment}>
          {ORDER_TYPES.map((type) => {
            const selected = type === orderType;
            return (
              <Pressable
                key={type}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={ORDER_TYPE_LABELS[type]}
                onPress={() => setOrderType(type)}
                style={[styles.segmentItem, selected && styles.segmentItemSelected]}>
                <Text style={styles.segmentEmoji}>{type === 'takeaway' ? '🥡' : '🪑'}</Text>
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
                  {ORDER_TYPE_LABELS[type]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Нэмэлт хүсэлт</Text>
        <View style={styles.card}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Жишээ: сүүгүй, элсэн чихэр багатай"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={300}
            style={[styles.input, styles.noteInput]}
          />
        </View>

        <Text style={styles.sectionTitle}>Захиалга</Text>
        <View style={styles.card}>
          {cart.lines.map((line) => (
            <View key={line.key} style={styles.summaryRow}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {line.quantity} × {line.name}
                {line.size ? ` (${line.size})` : ''}
              </Text>
              <Text style={[styles.summaryPrice, !line.available && styles.strike]}>
                {formatPrice(line.lineTotal)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Нийт</Text>
            <Text style={styles.totalValue}>{formatPrice(cart.total)}</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Icon name="info" size={16} color={colors.textMuted} />
          <Text style={styles.noticeText}>Төлбөрөө захиалгаа авахдаа касс дээр төлнө.</Text>
        </View>

        {placeOrder.error ? <Text style={styles.submitError}>{placeOrder.error.message}</Text> : null}
        {cart.hasUnavailable ? (
          <Text style={styles.submitError}>Сагсанд дууссан бараа байна. Сагсаа шалгана уу.</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Захиалга өгөх"
          trailing={formatPrice(cart.total)}
          loading={placeOrder.isPending}
          disabled={cart.hasUnavailable}
          onPress={submit}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, ...input }: TextInputProps & { label: string; error: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && styles.inputError]}
        {...input}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  field: { gap: spacing.xs },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.danger },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  fieldError: { fontSize: 13, color: colors.danger },
  segment: { flexDirection: 'row', gap: spacing.sm },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  segmentItemSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceMuted },
  segmentEmoji: { fontSize: 24 },
  segmentLabel: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  segmentLabelSelected: { color: colors.primary, fontWeight: '800' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryName: { flex: 1, fontSize: 15, color: colors.text },
  summaryPrice: { fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  strike: { textDecorationLine: 'line-through', color: colors.textMuted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  totalLabel: { fontSize: 17, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  noticeText: { flex: 1, fontSize: 13, color: colors.textMuted },
  submitError: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSurface,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
