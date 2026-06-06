// Единый enum ролей backend-приложения.
// Эти значения должны соответствовать ролям smart contract NotaryAccessControl.
export enum Role {
  // Полный административный доступ ко всей системе.
  SUPER_ADMIN = 'SUPER_ADMIN',
  // Администратор федеральной палаты: управляет регионами и аудиторами.
  FEDERAL_CHAMBER_ADMIN = 'FEDERAL_CHAMBER_ADMIN',
  // Администратор региональной палаты: управляет нотариусами своего региона.
  REGIONAL_CHAMBER_ADMIN = 'REGIONAL_CHAMBER_ADMIN',
  // Нотариус: регистрирует документы и межрегиональные запросы.
  NOTARY = 'NOTARY',
  // Аудитор: читает журналы и историю операций.
  AUDITOR = 'AUDITOR',
  // Проверяющий: выполняет verification без доступа к закрытому содержимому.
  VERIFIER = 'VERIFIER'
}
