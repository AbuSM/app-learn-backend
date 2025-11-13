export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  OBSERVER = 'observer',
}

export enum BoardVisibility {
  PRIVATE = 'private',
  WORKSPACE = 'workspace',
  PUBLIC = 'public',
}

export enum CardPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum CardStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
}

export enum ActionType {
  CREATE_BOARD = 'create_board',
  UPDATE_BOARD = 'update_board',
  DELETE_BOARD = 'delete_board',
  CREATE_LIST = 'create_list',
  UPDATE_LIST = 'update_list',
  DELETE_LIST = 'delete_list',
  CREATE_CARD = 'create_card',
  UPDATE_CARD = 'update_card',
  MOVE_CARD = 'move_card',
  DELETE_CARD = 'delete_card',
  ASSIGN_CARD = 'assign_card',
  UNASSIGN_CARD = 'unassign_card',
  ADD_COMMENT = 'add_comment',
  DELETE_COMMENT = 'delete_comment',
  ADD_MEMBER = 'add_member',
  REMOVE_MEMBER = 'remove_member',
  UPDATE_MEMBER_ROLE = 'update_member_role',
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
