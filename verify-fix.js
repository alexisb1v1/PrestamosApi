// Verificación del fix
const startDate = new Date('2026-01-28');
startDate.setHours(0, 0, 0, 0);

console.log('=== DESPUÉS DEL FIX ===\n');
console.log('Created (Otorgamiento): 27/01/2026');
console.log('Start Date (Día 1 de pago): 28/01/2026\n');

const endDate = new Date(startDate);
let workDaysAdded = 0;
const days = 24;

// Contar el start_date como día 1 si no es domingo
if (startDate.getDay() !== 0) {
    workDaysAdded = 1;
    console.log(`Día ${workDaysAdded}: ${startDate.toISOString().split('T')[0]} (Start Date)`);
}

// Sumar los días restantes
while (workDaysAdded < days) {
    endDate.setDate(endDate.getDate() + 1);
    if (endDate.getDay() !== 0) {
        workDaysAdded++;
        if (workDaysAdded <= 3 || workDaysAdded >= 22) {
            console.log(`Día ${workDaysAdded}: ${endDate.toISOString().split('T')[0]}`);
        }
        if (workDaysAdded === 3) console.log('...');
    }
}

console.log('\n✅ End Date (Día 24):', endDate.toISOString().split('T')[0]);
console.log('✅ Total días de pago:', workDaysAdded);
console.log('\n❌ ANTES del fix era: 25/02/2026');
console.log('✅ DESPUÉS del fix es: 24/02/2026');
