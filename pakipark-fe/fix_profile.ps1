$file = "src\features\profile\screens\AdminProfile.tsx"
$all = Get-Content $file
$keep = $all[0..833]

$tail = @"
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={colors.muted}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setTwoFactorModal(null)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSaveBtn, saving && s.disabled]} onPress={disable2FA} disabled={saving}>
                <Text style={s.modalSaveText}>{saving ? 'Saving' : 'Disable'}</Text>
              </TouchableOpacity>
            </View>
                  </View>
                </TouchableWithoutFeedback>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={gateModal} transparent animationType="fade" onRequestClose={() => setGateModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setGateModal(false)} activeOpacity={1} />
          <View style={[s.modalContent, { margin: 24 }]}>
            <View style={s.modalHeader}>
              <View style={s.modalIconBox}><Ionicons name="options-outline" size={20} color="#fff" /></View>
              <View style={s.modalHeaderText}>
                <Text style={s.modalTitle}>Advanced Options</Text>
                <Text style={s.modalSubtitle}>{editingRate ? 'Editing rate' : 'Add a new parking rate'}</Text>
              </View>
              <TouchableOpacity onPress={() => setGateModal(false)} style={s.closeBtn}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#FFF7ED', borderRadius: 10, padding: 10 }}>
                <Ionicons name="warning-outline" size={15} color="#F59E0B" />
                <Text style={{ flex: 1, fontSize: 12, color: '#92400E' }}>Rate changes affect all future bookings.</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={s.modalCancelBtn} onPress={() => setGateModal(false)}><Text style={s.modalCancelText}>CANCEL</Text></TouchableOpacity>
                <TouchableOpacity style={s.modalSaveBtn} onPress={proceedToRateForm}><Text style={s.modalSaveText}>PROCEED</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={rateModal} transparent animationType="slide" onRequestClose={() => setRateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.modalOverlay}>
              <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={[s.modalContent, { margin: 24 }]}>
                    <View style={s.modalHeader}>
                      <View style={s.modalHeaderText}><Text style={s.modalTitle}>{editingRate ? 'Edit Rate' : 'Add New Rate'}</Text></View>
                      <TouchableOpacity onPress={() => setRateModal(false)} style={s.closeBtn}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
                    </View>
                    <View style={{ padding: 16, gap: 14 }}>
                      <View>
                        <Text style={s.label}>RATE TYPE</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                          {(['hourly', 'daily', 'monthly'] as RateType[]).map((t) => (
                            <TouchableOpacity key={t} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: rateForm.type === t ? ADMIN_SETTINGS_HIGHLIGHT : '#F1F5F9', borderWidth: 1, borderColor: rateForm.type === t ? ADMIN_SETTINGS_HIGHLIGHT : colors.border }} onPress={() => setRateForm({ ...rateForm, type: t })}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: rateForm.type === t ? '#fff' : colors.muted }}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View>
                        <Text style={s.label}>AMOUNT</Text>
                        <TextInput style={[s.fieldInput, { marginTop: 6 }]} value={rateForm.rate} onChangeText={(v) => setRateForm({ ...rateForm, rate: v.replace(/[^0-9.]/g, '') })} keyboardType="decimal-pad" placeholder={getPlaceholder(rateForm.type)} placeholderTextColor={colors.muted} />
                      </View>
                      <View>
                        <Text style={s.label}>STATUS</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                          {(['active', 'inactive'] as RateStatus[]).map((st) => (
                            <TouchableOpacity key={st} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: rateForm.status === st ? (st === 'active' ? '#ECFDF5' : '#FEF2F2') : '#F1F5F9', borderWidth: 1, borderColor: rateForm.status === st ? (st === 'active' ? '#10B981' : '#EF4444') : colors.border }} onPress={() => setRateForm({ ...rateForm, status: st })}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: rateForm.status === st ? (st === 'active' ? '#10B981' : '#EF4444') : colors.muted }}>{st.charAt(0).toUpperCase() + st.slice(1)}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View style={s.modalActions}>
                        <TouchableOpacity style={s.modalCancelBtn} onPress={() => setRateModal(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity style={s.modalSaveBtn} onPress={saveRate}><Text style={s.modalSaveText}>{editingRate ? 'Update' : 'Save'}</Text></TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  nav: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#1C436B', textAlign: 'center' },
  scroll: { padding: 10, gap: 16, paddingBottom: 32 },
  hero: { position: 'relative', backgroundColor: '#10283C', borderRadius: 10, overflow: 'hidden' },
  heroGradientWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#10283C' },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroContent: { padding: 20, alignItems: 'center', zIndex: 1 },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarBox: { width: 74, height: 74, borderRadius: 14, backgroundColor: '#EE6B20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  avatarImg: { width: 74, height: 74, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  cameraBtn: { position: 'absolute', bottom: -7, right: -7, width: 26, height: 26, borderRadius: 13, backgroundColor: '#EE6B20', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1C436B' },
  heroName: { fontSize: 19, fontWeight: '900', color: '#fff', marginBottom: 3 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.62)', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 9, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(238,107,32,0.2)', borderWidth: 1, borderColor: 'rgba(238,107,32,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: '#EE6B20' },
  deptBadge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  deptBadgeText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  idBadge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  idBadgeText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, width: '100%' },
  statBox: { flex: 1, minHeight: 58, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 7, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 17, marginBottom: 3 },
  statLabel: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 10 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, gap: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#1C436B' },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  tabBtnTextActive: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1C436B' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EE6B20', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  cancelBtn: { height: 32, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  fieldWrap: { gap: 4 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.8 },
  fieldInput: { height: 46, borderRadius: 12, backgroundColor: '#F8FAFC', paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: '#1C436B', borderWidth: 1, borderColor: '#E5E7EB' },
  fieldInputDisabled: { color: '#9CA3AF' },
  securityCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  secTitle: { fontSize: 14, fontWeight: '800', color: '#1C436B', marginBottom: 4 },
  secBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 42, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#1C436B', borderRadius: 12, paddingHorizontal: 12 },
  secBtnActive: { backgroundColor: '#1C436B' },
  secBtnMuted: { backgroundColor: '#fff', borderColor: '#E5E7EB' },
  secBtnText: { fontSize: 12, fontWeight: '700', color: '#1C436B' },
  secBtnTextActive: { color: '#fff' },
  secSwitchRow: { justifyContent: 'space-between', paddingRight: 8, paddingTop: 4 },
  secSwitchLabel: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rateItem: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  rateTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rateIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1C436B', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rateName: { fontSize: 14, fontWeight: '800', color: '#1C436B' },
  rateHourly: { fontSize: 20, fontWeight: '900', color: '#1C436B' },
  rateDaily: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  rateBtns: { flexDirection: 'row', gap: 8 },
  rateEditBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: '#1C436B', backgroundColor: '#EFF6FF' },
  rateEditBtnText: { fontSize: 12, fontWeight: '700', color: '#1C436B' },
  rateDeleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  rateDeleteBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeActive: { backgroundColor: '#ECFDF5' },
  statusBadgeInactive: { backgroundColor: '#F3F4F6' },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  statusBadgeTextActive: { color: '#10B981' },
  statusBadgeTextInactive: { color: '#9CA3AF' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12 },
  activityIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1C436B' },
  activityTime: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  activityTimeText: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(30,61,90,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  modalHeader: { backgroundColor: '#1C436B', padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalHeaderText: { flex: 1 },
  modalIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EE6B20', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  modalSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  closeBtn: { marginLeft: 'auto', padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  modalBody: { padding: 20 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 9, fontWeight: '900', color: '#8FA0B7', textTransform: 'uppercase', letterSpacing: 1.2 },
  passwordInputWrapper: { position: 'relative', justifyContent: 'center' },
  passwordInput: { height: 48, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingRight: 40, fontSize: 14, color: '#1C436B' },
  eyeIcon: { position: 'absolute', right: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 13, fontWeight: '800', color: '#9CA3AF' },
  modalSaveBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#EE6B20', alignItems: 'center', justifyContent: 'center' },
  modalSaveText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  twoFactorCard: { margin: 16, backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 12 },
  twoFactorTitle: { fontSize: 18, fontWeight: '900', color: '#1C436B' },
  twoFactorHelp: { fontSize: 12, lineHeight: 18, color: '#9CA3AF' },
  twoFactorSecretHeader: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  twoFactorSecret: { borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F8FAFC', padding: 12, color: '#1C436B', fontWeight: '900' },
  twoFactorSecretText: { flex: 1 },
  copySecretBtn: { minWidth: 76, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF7F2', alignItems: 'center', justifyContent: 'center', gap: 4 },
  copySecretText: { color: '#EE6B20', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.65 },
});
"@

$combined = $keep + $tail.Split("`n")
$combined | Set-Content $file -Encoding UTF8
Write-Host "Done. Total lines: $($combined.Count)"
