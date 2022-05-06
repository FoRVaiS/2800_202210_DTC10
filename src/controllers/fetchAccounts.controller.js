const data = require('../__database__');

const fetchAccountsPostController = (req, res) => {
  const { userUid } = req.session;

  // Get the user whose uid matches session.uid
  const user = data.users.filter(user => user.uid === userUid)[0];

  if (!user?.roles.includes('admin')) return res.status(403).json({ success: false });

  res.status(200).json({
    success: true,
    users: data?.users ?? {},
  });
};

module.exports = { fetchAccountsPostController };
