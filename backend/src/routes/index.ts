import { Router } from 'express';
import auth from './modules/auth';
import users from './modules/users';
import applications from './modules/applications';
import goals from './modules/goals';
import submissions from './modules/submissions';
import awards from './modules/awards';
import uploads from './modules/uploads';
import ranking from './modules/ranking';
import notifications from './modules/notifications';
import logs from './modules/logs';
import admin from './modules/admin';
import downloads from './modules/downloads';
import pub from './modules/public';
import assignments from './modules/assignments';

const router = Router();

router.use('/auth', auth);
router.use('/users', users);
router.use('/applications', applications);
router.use('/goals', goals);
router.use('/submissions', submissions);
router.use('/awards', awards);
router.use('/uploads', uploads);
router.use('/ranking', ranking);
router.use('/notifications', notifications);
router.use('/logs', logs);
router.use('/admin', admin);
router.use('/downloads', downloads);
router.use('/public', pub);
router.use('/assignments', assignments);

export default router;
