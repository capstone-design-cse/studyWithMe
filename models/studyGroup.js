const Sequelize = require('sequelize');

module.exports = class StudyGroup extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            groupId: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
                primaryKey: true,
            },
            groupName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            groupLeader: {
                type: Sequelize.STRING(40),
                allowNull: false,
            },
        }, {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'StudyGroup',
            tableName: 'studyGroups',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db){
        // 스터디장:사용자 = N:1
        db.StudyGroup.belongsTo(db.User, {
            foreignKey: 'groupLeader',
            targetKey: 'email',
            //onDelete: 'cascade',
            //onUpdate: 'cascade',
        });
        // 스터디:스터디원 = N:M
        db.StudyGroup.belongsToMany(db.User, {
            through: 'GroupMember',
            foreignKey: 'groupId',
        });
        // 스터디:규칙 = 1:1
        db.StudyGroup.hasOne(db.StudyRule)
        // db.StudyGroup.hasOne(db.studyRule, {
        //     foreignKey: 'groupId',
        //     sourceKey: 'groupId',
        // });
        // 스터디:스터디일정 = 1:N
        db.StudyGroup.hasMany(db.StudySchedule, {
            foreignKey: 'groupId',
            sourceKey: 'groupId',
        });
    }
};