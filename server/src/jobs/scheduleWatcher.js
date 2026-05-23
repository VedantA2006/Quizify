const ClassExamSchedule = require('../models/ClassExamSchedule');
const ClassBatch = require('../models/ClassBatch');
const ExamShareLink = require('../models/ExamShareLink');
const User = require('../models/User');
const { scheduleJob } = require('./queue');
const env = require('../config/env');

const runScheduleCheck = async () => {
  const now = new Date();
  console.log(`[Watcher] Executing periodic classroom schedule validation check at: ${now.toISOString()}`);

  try {
    // a) ACTIVATE Scheduled Exams
    const scheduledExams = await ClassExamSchedule.find({
      scheduledStart: { $lte: now },
      status: 'scheduled'
    }).populate('exam', 'title').populate('class', 'name');

    for (const s of scheduledExams) {
      s.status = 'live';
      await s.save();
      console.log(`[Watcher] Exam "${s.exam?.title}" is now LIVE for classroom "${s.class?.name}"`);
    }

    // b) COMPLETE Live Exams (Deactivate join links)
    const liveExams = await ClassExamSchedule.find({
      scheduledEnd: { $lte: now },
      status: 'live'
    }).populate('exam', 'title').populate('class', 'name');

    for (const s of liveExams) {
      s.status = 'completed';
      await s.save();

      if (s.shareLink) {
        await ExamShareLink.findByIdAndUpdate(s.shareLink, { isActive: false });
      }
      console.log(`[Watcher] Exam "${s.exam?.title}" completed and deactivated for classroom "${s.class?.name}"`);
    }

    // c) SEND 24-HOUR EMAIL REMINDERS
    const reminderStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23h from now
    const reminderEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);   // 25h from now

    const nearSchedules = await ClassExamSchedule.find({
      scheduledStart: { $gte: reminderStart, $lte: reminderEnd },
      reminderSent: false,
      status: 'scheduled'
    }).populate('exam', 'title').populate('class', 'name').populate('shareLink', 'slug');

    for (const s of nearSchedules) {
      s.reminderSent = true;
      await s.save();

      const classroom = await ClassBatch.findById(s.class).populate('students', 'name email');
      if (classroom && classroom.students?.length > 0) {
        const joinUrl = s.shareLink ? `${env.CLIENT_URL}/e/${s.shareLink.slug}` : `${env.CLIENT_URL}/join`;
        
        for (const student of classroom.students) {
          if (student.email) {
            await scheduleJob('send-email', {
              to: student.email,
              subject: `Reminder: ${s.exam?.title || 'Exam'} starts tomorrow`,
              html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #4f46e5; margin-bottom: 20px;">Assessment Reminder</h2>
                  <p>Hi ${student.name || 'Student'},</p>
                  <p>This is a reminder that the assessment <strong>${s.exam?.title || 'Exam'}</strong> is scheduled to begin in your class <strong>${s.class?.name || 'Classroom'}</strong> tomorrow.</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                    <p style="margin: 5px 0;"><strong>Start Time:</strong> ${s.scheduledStart.toLocaleString()}</p>
                    <p style="margin: 5px 0;"><strong>Timezone:</strong> ${s.timezone}</p>
                  </div>
                  <p>You can join the exam using the button below once it goes live:</p>
                  <a href="${joinUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Go to Exam</a>
                  <p style="margin-top: 25px; font-size: 0.9em; color: #64748b;">Best regards,<br/>The Quizify Assessment Team</p>
                </div>
              `
            });
          }
        }
      }
      console.log(`[Watcher] Queued 24h reminders for "${s.exam?.title}" for classroom "${s.class?.name}"`);
    }

  } catch (err) {
    console.error('[Watcher] Error inside scheduled watcher job execution:', err);
  }
};

const startScheduleWatcher = () => {
  // Run check immediately upon server boot
  runScheduleCheck();
  
  // Schedule to execute every 5 minutes
  setInterval(runScheduleCheck, 5 * 60 * 1000);
  console.log('[Watcher] Classroom schedule periodic monitor successfully started (5m interval).');
};

module.exports = { startScheduleWatcher };
