const { CompanyModel } = require('../models/company.model');

const doesCompanyExist = async name => (await CompanyModel.find({ name })).length;
const doesLocationExist = async (location) => (await CompanyModel.find({
  locations: {
    $elemMatch: { name: location }
  }
})).length;

const submitSalary = async (req, res) => {
  const { age = null, gender = null, salary = null, position = null, location = null } = req.body || {};
  const { uid = null } = req.session || {};

  if (!uid) return res.status(403).json({
    success: false,
    data: {
      msg: 'You need to be logged in to use this resource'
    },
  });

  if (!age || Number(age) === NaN) return res.status(400).json({
    success: false,
    data: {
      msg: 'The field \'age\' is required to be a number',
    },
  });

  if (!gender) return res.status(400).json({
    success: false,
    data: {
      msg: 'The field \'gender\' is required to be a string',
    },
  });  

  if (!salary || Number(salary) === NaN) return res.status(400).json({
    success: false,
    data: {
      msg: 'The field \'salary\' is required to be a number',
    },
  });

  if (!position) return res.status(400).json({
    success: false,
    data: {
      msg: 'The field \'position\' is required to be a string',
    },
  });

  if (!location) return res.status(400).json({
    success: false,
    data: {
      msg: 'The field \'location\' is required to be a string',
    },
  });

  const company = await CompanyModel.findOne({
    locations: {
      $elemMatch: { name: location }
    }
  })

  if (company) {
    // The company and location already exist
    await CompanyModel.updateOne({
      locations: {
        $elemMatch: { name: location }
      },
    }, {
      $push: {
        'locations.$.salaries': {
          userId: uid,
          salary,
          position,
        }
      },
    });
  } else {
    return res.status(500).json({
      success: false,
      data: {
        msg: 'Could not find a company associated with the location.',
      },
    });
  };

  res.status(200).json({
    success: true,
    data: null,
  });
};

const convertToSalaryData = (company) => {
  const salaryData = [];

  for (const location of company.locations) {
    for (const salary of location.salaries) {
      salaryData.push({
        postId: salary._id,
        company: company.name,
        location: location.name,
        position: salary.position,
        userId: salary.userId,
        salary: salary.salary,
        reported: salary.reported,
      });
    };
  }

  return salaryData;
}

const fetchSalaryFromLocation = async (req, res) => {
  const { location = null, position = null } = req.body || {};

  if (!position) return res.status(400).json({
    success: false,
    data: {
      msg: 'The field \'position\' is required to be a string',
    },
  });

  if (!location) return res.status(400).json({
    success: false,
    data: {
      msg: 'The field \'location\' is required to be a string',
    },
  });

  const [company] = await CompanyModel.find({
    locations: {
      $elemMatch: {
        name: location,
      }
    }
  }, { __v: 0 });

  if (!company) return res.status(500).json({
    success: false,
    data: {
      msg: 'Location could not be found or it does not exist',
    },
  });

  const salaryData = convertToSalaryData(company)
    .filter((data) => data.location.toLowerCase() === location.toLowerCase() 
                   && data.position.toLowerCase() === position.toLowerCase());
  
  res.status(200).json({
    success: true,
    data: salaryData,
  });
};

const fetchAllSalaries = async (req, res) => {
  const allCompanies = await CompanyModel.find({}, { __v: 0 });

  const salaryData = allCompanies.flatMap(company => convertToSalaryData(company));

  res.status(200).json({
    success: true,
    data: salaryData,
  });
};

module.exports = { submitSalary, fetchSalaryFromLocation, fetchAllSalaries, doesCompanyExist, doesLocationExist, convertToSalaryData };
