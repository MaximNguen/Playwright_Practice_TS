export interface RouteExpectation {
  readonly path: string;
  readonly expectedTexts: readonly string[];
}

export interface SidebarItem {
  readonly label: string;
  readonly route: string;
}

export const ROUTES: readonly RouteExpectation[] = [
  { path: '/dashboard', expectedTexts: ['Панель управления офисом', 'Последние задачи', 'KPI'] },
  { path: '/calendar', expectedTexts: ['Календарь', 'Сегодня', 'Создать'] },
  { path: '/materials', expectedTexts: ['Материалы', 'Добавить', 'Диск'] },
  { path: '/materials/disk', expectedTexts: ['Диск', 'Создать папку', 'Добавить'] },
  { path: '/departments', expectedTexts: ['Отделения', 'Создать'] },
  { path: '/employees', expectedTexts: ['Сотрудники', 'Добавить'] },
  { path: '/chat', expectedTexts: ['ИИ-ассистент', 'Новый чат'] },
  { path: '/settings', expectedTexts: ['Настройки', 'Сохранить изменения'] },
  { path: '/admin', expectedTexts: ['Администрирование'] },
];

export const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  { label: 'Главная', route: '/dashboard' },
  { label: 'Календарь', route: '/calendar' },
  { label: 'Материалы', route: '/materials' },
  { label: 'Отделения', route: '/departments' },
  { label: 'Сотрудники', route: '/employees' },
  { label: 'Чат', route: '/chat' },
  { label: 'Настройки', route: '/settings' },
];
