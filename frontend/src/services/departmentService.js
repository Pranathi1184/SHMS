import createCrudService from './createCrudService';

const crud = createCrudService('/departments');

export const departmentService = {
  createDepartment: crud.create,
  getDepartments: crud.getAll,
  getDepartmentById: crud.getById,
  updateDepartment: crud.update,
  deleteDepartment: crud.delete,
};
