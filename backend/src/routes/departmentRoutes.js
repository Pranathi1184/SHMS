const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const {
  validateCreateDepartment,
  validateUpdateDepartment,
  validateGetDepartments,
} = require('../validations/department');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.post('/', authenticateToken, authorizeRoles('Administrator'), validateCreateDepartment, departmentController.createDepartment);
router.get('/', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse', 'Patient'), validateGetDepartments, departmentController.getDepartments);
router.get('/:id', authenticateToken, authorizeRoles('Administrator', 'Doctor', 'Receptionist', 'Nurse', 'Patient'), departmentController.getDepartmentById);
router.put('/:id', authenticateToken, authorizeRoles('Administrator'), validateUpdateDepartment, departmentController.updateDepartment);
router.delete('/:id', authenticateToken, authorizeRoles('Administrator'), departmentController.deleteDepartment);

module.exports = router;
