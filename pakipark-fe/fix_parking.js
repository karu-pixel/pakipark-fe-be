const fs = require('fs');
const file = 'c:/Users/Juliana Mari Alejo/Downloads/pakipark-fe-be-fix-profile-2fa-password-copy/pakipark-fe-be-fix-profile-2fa-password-copy/pakipark-fe/src/features/parking/screens/ParkingScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Readonly props
content = content.replace(/function SlotChip\(\{(.*?)\}: \{(.*?)\}\)/s, 'function SlotChip({$1}: Readonly<{$2}>)');
content = content.replace(/function GenerateSlotsModal\(\{(.*?)\}: \{(.*?)\}\)/s, 'function GenerateSlotsModal({$1}: Readonly<{$2}>)');
content = content.replace(/function SlotDetailModal\(\{(.*?)\}: \{(.*?)\}\)/s, 'function SlotDetailModal({$1}: Readonly<{$2}>)');
content = content.replace(/export function ParkingScreen\(\{ route \}: \{ route\?: \{ params\?: \{ locationId\?: string \} \} \}\)/, 'export function ParkingScreen({ route }: Readonly<{ route?: { params?: { locationId?: string } } }>)');

// 2. parseInt -> Number.parseInt
content = content.replace(/slotsPerSection: parseInt\(slotsPerSection\)/, 'slotsPerSection: Number.parseInt(slotsPerSection)');
content = content.replace(/floors: parseInt\(floors\)/, 'floors: Number.parseInt(floors)');

// 3. acc[key] ??= [];
content = content.replace(/if \(!acc\[key\]\) acc\[key\] = \[\];/, 'acc[key] ??= [];');

// 4. Nested ternaries
content = content.replace(/\{loading \? \(\s*<View style=\{s\.loaderWrap\}>\s*<ActivityIndicator size="large" color=\{colors\.orange\} \/>\s*<Text style=\{s\.loaderText\}>Loading slots…<\/Text>\s*<\/View>\s*\) : error \? \(\s*<View style=\{s\.errorWrap\}>\s*<Ionicons name="cloud-offline-outline" size=\{44\} color="#CBD5E1" \/>\s*<Text style=\{s\.errorText\}>\{error\}<\/Text>\s*<TouchableOpacity style=\{s\.retryBtn\} onPress=\{\(\) => fetchSlots\(\)\}>\s*<Text style=\{s\.retryText\}>Retry<\/Text>\s*<\/TouchableOpacity>\s*<\/View>\s*\) : slots\.length === 0 \? \(\s*<View style=\{s\.emptySlots\}>\s*<Ionicons name="grid-outline" size=\{52\} color="#CBD5E1" \/>\s*<Text style=\{s\.emptyTitle\}>No slots configured<\/Text>\s*<Text style=\{s\.emptyText\}>Generate slots to set up the parking layout for \{selectedLocation\?\.name \|\| 'this location'\}\.<\/Text>\s*<TouchableOpacity style=\{s\.generateFullBtn\} onPress=\{\(\) => setGenerateOpen\(true\)\}>\s*<Ionicons name="flash-outline" size=\{18\} color="#fff" \/>\s*<Text style=\{s\.generateFullText\}>Generate Slots Now<\/Text>\s*<\/TouchableOpacity>\s*<\/View>\s*\) : \(/,
`{loading && (
            <View style={s.loaderWrap}>
              <ActivityIndicator size="large" color={colors.orange} />
              <Text style={s.loaderText}>Loading slots…</Text>
            </View>
          )}
          {!loading && error && (
            <View style={s.errorWrap}>
              <Ionicons name="cloud-offline-outline" size={44} color="#CBD5E1" />
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={() => fetchSlots()}>
                <Text style={s.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {!loading && !error && slots.length === 0 && (
            <View style={s.emptySlots}>
              <Ionicons name="grid-outline" size={52} color="#CBD5E1" />
              <Text style={s.emptyTitle}>No slots configured</Text>
              <Text style={s.emptyText}>Generate slots to set up the parking layout for {selectedLocation?.name || 'this location'}.</Text>
              <TouchableOpacity style={s.generateFullBtn} onPress={() => setGenerateOpen(true)}>
                <Ionicons name="flash-outline" size={18} color="#fff" />
                <Text style={s.generateFullText}>Generate Slots Now</Text>
              </TouchableOpacity>
            </View>
          )}
          {!loading && !error && slots.length > 0 && (`);

// 5. sort -> toSorted
content = content.replace(/\.sort\(\(a, b\) => a\.slotNumber\.localeCompare\(b\.slotNumber, undefined, \{ numeric: true \}\)\)/, '.toSorted((a, b) => a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true }))');

fs.writeFileSync(file, content);
console.log('Done!');
