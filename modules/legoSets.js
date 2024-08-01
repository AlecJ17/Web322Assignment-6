require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      port: 5432,
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false  // Ensure that this is actually needed for your setup
        },
      },
    });

sequelize
    .authenticate()
    .then(() => {
      console.log('Connection has been established successfully.');
    })
    .catch((err) => {
      console.log('Unable to connect to the database:', err);
    });

const Theme = sequelize.define('Theme', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING
}, {
  timestamps: false
});

const Set = sequelize.define('Set', {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: {
    type: Sequelize.INTEGER,
    references: {
      model: 'Themes',
      key: 'id'
    }
  },
  img_url: Sequelize.STRING
}, {
  timestamps: false
});

Set.belongsTo(Theme, { foreignKey: 'theme_id' });


function initialize() {
  return sequelize.sync();
}

function getAllSets() {
  return Set.findAll({ include: [Theme] });
}


function getSetByNum(setNum) {
  return Set.findOne({
    where: { set_num: setNum },
    include: [Theme]
  });
}

function getSetsByTheme(theme) {
  return Set.findAll({
    include: [{
      model: Theme,
      where: {
        name: {
          [Sequelize.Op.iLike]: `%${theme}%`
        }
      }
    }]
  });
}

function getAllThemes() {
  return Theme.findAll();
}

function addSet(setData) {
  return Set.create(setData);
}

async function editSet(set_num, setData) {
  try {
    const result = await Set.update(setData, {
      where: { set_num: set_num }
    });
    return result; // This will return an array with the first element being the number of affected rows.
  } catch (err) {
    throw err;
  }
}

function deleteSet(set_num) {
  return Set.destroy({
    where: { set_num: set_num }
  });
}


module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, getAllThemes, addSet, editSet, deleteSet }
