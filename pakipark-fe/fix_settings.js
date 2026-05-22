const fs = require('fs');
const file = 'c:/Users/Juliana Mari Alejo/Downloads/pakipark-fe-be-fix-profile-2fa-password-copy/pakipark-fe-be-fix-profile-2fa-password-copy/pakipark-fe/src/features/settings/screens/SettingsScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/type Tab = 'parking-rates' \| 'payment-methods';/, 
`type Tab = 'parking-rates' | 'payment-methods';
type RateType = 'hourly' | 'daily' | 'monthly';
type RateStatus = 'active' | 'inactive';`);

content = content.replace(/type: 'hourly' \| 'daily' \| 'monthly';/g, `type: RateType;`);
content = content.replace(/type: 'hourly' as 'hourly' \| 'daily' \| 'monthly'/g, `type: 'hourly' as RateType`);
content = content.replace(/status: 'active' as 'active' \| 'inactive'/g, `status: 'active' as RateStatus`);
content = content.replace(/RATE_TYPES: Array\<'hourly' \| 'daily' \| 'monthly'\>/g, `RATE_TYPES: Array<RateType>`);

content = content.replace(/type: \(rate\.type \|\| 'hourly'\) as 'hourly' \| 'daily' \| 'monthly'/g, `type: (rate.type || 'hourly') as RateType`);
content = content.replace(/status: \(rate\.status === 'inactive' \? 'inactive' : 'active'\) as 'active' \| 'inactive'/g, `status: (rate.status === 'inactive' ? 'inactive' : 'active') as RateStatus`);

content = content.replace(/.*const \[methodsLoading, setMethodsLoading\].*\n/g, '');
content = content.replace(/.*const \[saving, setSaving\].*\n/g, '');
content = content.replace(/.*setSaving\(true\);\n/g, '');
content = content.replace(/.*setSaving\(false\);\n/g, '');

content = content.replace(/if \(response && response\.payment_methods\) {/g, `if (response?.payment_methods) {`);

content = content.replace(/isNaN\(amount\)/g, `Number.isNaN(amount)`);

content = content.replace(/const getRateUnit = /g, 
`const getRateLabel = (type: string) => {
    if (type === 'daily') return 'Daily';
    if (type === 'monthly') return 'Monthly';
    return 'Hourly';
  };

  const getPlaceholder = (type: string) => {
    if (type === 'daily') return 'e.g. 300';
    if (type === 'monthly') return 'e.g. 5000';
    return 'e.g. 55';
  };

  const getRateUnit = `);

content = content.replace(/\{ratesLoading \? \(\s*<ActivityIndicator size="small" color=\{colors\.orange\} style=\{\{ marginVertical: 24 \}\} \/>\s*\) : rates\.length === 0 \? \(\s*<View style=\{\{ paddingVertical: 24, alignItems: 'center' \}\}>\s*<Ionicons name="alert-circle-outline" size=\{40\} color=\{colors\.muted\} \/>\s*<Text style=\{\{ color: colors\.muted, marginTop: 8 \}\}>No parking rates found\.<\/Text>\s*<\/View>\s*\) : \(/,
`{ratesLoading && (
              <ActivityIndicator size="small" color={colors.orange} style={{ marginVertical: 24 }} />
            )}
            {!ratesLoading && rates.length === 0 && (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={40} color={colors.muted} />
                <Text style={{ color: colors.muted, marginTop: 8 }}>No parking rates found.</Text>
              </View>
            )}
            {!ratesLoading && rates.length > 0 && (`);

content = content.replace(/\{rate\.type === 'hourly' \? 'Hourly Rate' : rate\.type === 'daily' \? 'Daily Rate' : 'Monthly Rate'\}/g, 
  `{getRateLabel(rate.type)} Rate`);

content = content.replace(/\{editingRate \? \`Editing: \$\{editingRate\.type === 'hourly' \? 'Hourly' : editingRate\.type === 'daily' \? 'Daily' : 'Monthly'\} Rate\` : 'Add a new parking rate'\}/g,
  `{editingRate ? \`Editing: \${getRateLabel(editingRate.type)} Rate\` : 'Add a new parking rate'}`);

content = content.replace(/\{t === 'hourly' \? 'Hourly' : t === 'daily' \? 'Daily' : 'Monthly'\}/g,
  `{getRateLabel(t)}`);

content = content.replace(/placeholder=\{rateForm\.type === 'hourly' \? 'e\.g\. 55' : rateForm\.type === 'daily' \? 'e\.g\. 300' : 'e\.g\. 5000'\}/g,
  `placeholder={getPlaceholder(rateForm.type)}`);

content = content.replace(/\.sort\(\(a, b\) => a\.name === 'Cash on Site' \? -1 : b\.name === 'Cash on Site' \? 1 : 0\)/g,
  `.sort((a, b) => {
                if (a.name === 'Cash on Site') return -1;
                if (b.name === 'Cash on Site') return 1;
                return 0;
              })`);

fs.writeFileSync(file, content);
console.log('Done!');
