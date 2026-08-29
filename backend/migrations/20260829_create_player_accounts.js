require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcrypt');
const pool = require('../src/db/index');
const { BCRYPT_ROUNDS } = require('../src/config/auth');

const INITIAL_PASSWORD = '12345678';
const CONFIRM_VALUE = 'CREATE_100_PLAYER_ACCOUNTS';
const EXISTING_GAO_ACCOUNT = '18026381712';

const players = [
  [5, '阿克努', 'akenu'],
  [6, '贾恺麒', 'jiakaiqi'],
  [7, '加依达尔', 'jiayidaer'],
  [8, '黄麟云', 'huanglinyun'],
  [9, '杨谨泽', 'yangjinze'],
  [10, '莫洋', 'moyang'],
  [11, '高嘉恒', null],
  [12, '张乐骞', 'zhangleqian'],
  [13, '宁佳珺', 'ningjiajun'],
  [14, '王佳良', 'wangjialiang'],
  [15, '李朝澎', 'lichaopeng'],
  [16, '桑拉提', 'sanglati'],
  [17, '范祥宁', 'fanxiangning'],
  [18, '李禹佑', 'liyuyou'],
  [19, '唐玮泽', 'tangweize'],
  [20, '许一兵', 'xuyibing'],
  [21, '宋哈尔', 'songhaer'],
  [22, '赵品哲', 'zhaopinzhe'],
  [23, '吕世博', 'lushibo'],
  [24, '龚泊良', 'gongboliang'],
  [25, '马帝', 'madi'],
  [26, '汤派', 'tangpai'],
  [27, '薛芗苇芃', 'xuexiangweipeng'],
  [28, '吾克铁木', 'wuketiemu'],
  [29, '王廷昊', 'wangtinghao'],
  [30, '苏巴提', 'subati'],
  [31, '刘同贺', 'liutonghe'],
  [32, '李一陈', 'liyichen'],
  [33, '毕经智', 'bijingzhi'],
  [34, '李金益', 'lijinyi'],
  [35, '辛卓达', 'xinzhuoda'],
  [36, '吴樾', 'wuyue'],
  [37, '李浩天', 'lihaotian'],
  [38, 'Chada', 'chada'],
  [39, 'JeanDox', 'jeandox'],
  [40, 'Ryan', 'ryan'],
  [41, 'SengMenghuy', 'sengmenghuy'],
  [42, '丹增甘旦', 'danzenggandan'],
  [43, '任佳宁', 'renjianing'],
  [44, '任天瑜', 'rentianyu'],
  [45, '伊尔凡', 'yierfan'],
  [46, '依木拉', 'yimula'],
  [47, '刘华泽', 'liuhuaze'],
  [48, '刘彦成', 'liuyancheng'],
  [49, '刘柏言', 'liubaiyan'],
  [50, '卢虹宇', 'luhongyu'],
  [51, '咸晨曦', 'xianchenxi'],
  [52, '姚若翔', 'yaoruoxiang'],
  [53, '宁斌', 'ningbin'],
  [54, '巴力加那提', 'balijianati'],
  [55, '张亦驰', 'zhangyichi'],
  [56, '张劼', 'zhangjie'],
  [57, '张宇轩', 'zhangyuxuan'],
  [58, '张晨瑞', 'zhangchenrui'],
  [59, '徐建祯', 'xujianzhen'],
  [60, '徐秋临', 'xuqiulin'],
  [61, '旦增格桑', 'danzenggesang'],
  [62, '明发', 'mingfa'],
  [63, '朱天梁', 'zhutianliang'],
  [64, '李东波', 'lidongbo'],
  [65, '李梓权', 'liziquan'],
  [66, '李祖卿', 'lizuqing'],
  [67, '杨晟', 'yangsheng'],
  [68, '杨柏栋', 'yangbaidong'],
  [69, '杨骋远', 'yangchengyuan'],
  [70, '梁峻萁', 'liangjunqi'],
  [71, '次仁格桑', 'cirengesang'],
  [72, '次仁班久', 'cirenbanjiu'],
  [73, '江文龙', 'jiangwenlong'],
  [74, '滕胤辰', 'tengyinchen'],
  [75, '王元壮', 'wangyuanzhuang'],
  [76, '王劲松', 'wangjinsong'],
  [77, '王彦霖', 'wangyanlin'],
  [78, '王睿笛', 'wangruidi'],
  [79, '王誉铭', 'wangyuming'],
  [80, '王鹏', 'wangpeng'],
  [81, '田峻豪', 'tianjunhao'],
  [82, '胡琢成', 'huzhuocheng'],
  [83, '蔡尽亨', 'caijinheng'],
  [84, '薛彭午', 'xuepengwu'],
  [85, '袁志祺', 'yuanzhiqi'],
  [86, '许远庆', 'xuyuanqing'],
  [87, '贾志圣', 'jiazhisheng'],
  [88, '边千盛', 'bianqiansheng'],
  [89, '迪力亚尔', 'diliyaer'],
  [90, '钮麟峰', 'niulinfeng'],
  [91, '阿依波利', 'ayiboli'],
  [92, '阿斯如', 'asiru'],
  [93, '阿迪力', 'adili'],
  [94, '陈满满', 'chenmanman'],
  [95, '霍禧齐', 'huoxiqi'],
  [96, '韦林涛', 'weilintao'],
  [97, '鲍宏宇', 'baohongyu'],
  [98, '麦尔旦', 'maierdan'],
  [99, '蓝煜', 'lanyu'],
  [100, '赵润石', 'zhaorunshi'],
  [101, '刘凯宁', 'liukaining'],
  [102, '冒佳徐', 'maojiaxu'],
  [103, '夏甫海提', 'xiafuhaiti'],
  [104, '才旺', 'caiwang'],
  [105, 'Somnang', 'somnang'],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function verifySchema(connection) {
  const [userColumns] = await connection.query('SHOW COLUMNS FROM users');
  const names = new Set(userColumns.map(column => column.Field));
  for (const required of ['account', 'must_change_password', 'auth_version']) {
    assert(names.has(required), `数据库结构尚未升级：users.${required} 不存在`);
  }
  const [bindingTable] = await connection.query("SHOW TABLES LIKE 'user_player_bindings'");
  assert(bindingTable.length === 1, '数据库结构尚未升级：user_player_bindings 不存在');
}

async function loadAndVerifyState(connection, lock = false) {
  const ids = players.map(([id]) => id);
  const [playerRows] = await connection.query(
    `SELECT id, name FROM players WHERE id IN (${ids.map(() => '?').join(',')})${lock ? ' FOR UPDATE' : ''}`,
    ids
  );
  assert(playerRows.length === players.length, `队员数量不匹配：预期 ${players.length}，实际 ${playerRows.length}`);

  const byId = new Map(playerRows.map(player => [player.id, player.name]));
  const changed = players.filter(([id, name]) => byId.get(id) !== name);
  assert(changed.length === 0, `队员姓名或 ID 已变化：${changed.map(([id, name]) => `${id}-${name}`).join('、')}`);

  const [users] = await connection.query(
    `SELECT id, account, username, role FROM users${lock ? ' FOR UPDATE' : ''}`
  );
  const gaoUsers = users.filter(user => user.account === EXISTING_GAO_ACCOUNT || user.username === 'gavigao');
  assert(gaoUsers.length === 1, `无法唯一定位高嘉恒现有账号：找到 ${gaoUsers.length} 个候选`);

  const kiritoUsers = users.filter(user => user.username === 'Kirito');
  assert(kiritoUsers.length <= 1, `Kirito 用户不唯一：找到 ${kiritoUsers.length} 个`);
  if (kiritoUsers[0]) assert(kiritoUsers[0].role !== 'owner', '安全停止：Kirito 是总负责人账号');

  const plannedAccounts = new Set(players.map(([, , account]) => account).filter(Boolean));
  const kiritoId = kiritoUsers[0]?.id;
  const collisions = users.filter(user => user.id !== kiritoId && plannedAccounts.has(String(user.account).toLowerCase()));
  assert(collisions.length === 0, `账号已存在：${collisions.map(user => user.account).join('、')}`);

  const [bindings] = await connection.query(
    `SELECT user_id, player_id FROM user_player_bindings
     WHERE user_id = ? OR player_id IN (${ids.map(() => '?').join(',')})${lock ? ' FOR UPDATE' : ''}`,
    [gaoUsers[0].id, ...ids]
  );
  const invalidBindings = bindings.filter(binding => !(
    binding.user_id === gaoUsers[0].id && binding.player_id === 11
  ));
  assert(invalidBindings.length === 0, '目标队员中已存在计划外绑定，请先人工检查');

  return { gaoUser: gaoUsers[0], kiritoUser: kiritoUsers[0] || null };
}

async function main() {
  const connection = await pool.getConnection();
  let transactionStarted = false;
  try {
    await verifySchema(connection);
    const state = await loadAndVerifyState(connection);
    console.log('PLAYER_ACCOUNT_PREFLIGHT_OK', {
      players: players.length,
      newAccounts: players.filter(([, , account]) => account).length,
      gaoAccount: state.gaoUser.account,
      kiritoUserId: state.kiritoUser?.id || null,
      initialPassword: INITIAL_PASSWORD,
      mustChangePassword: true,
    });

    if (process.env.CONFIRM_PLAYER_ACCOUNT_MIGRATION !== CONFIRM_VALUE) {
      console.log(`DRY_RUN_ONLY: 设置 CONFIRM_PLAYER_ACCOUNT_MIGRATION=${CONFIRM_VALUE} 后才会写入数据库`);
      return;
    }

    const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_ROUNDS);
    await connection.beginTransaction();
    transactionStarted = true;
    const lockedState = await loadAndVerifyState(connection, true);

    if (lockedState.kiritoUser) {
      await connection.query('DELETE FROM users WHERE id = ?', [lockedState.kiritoUser.id]);
    }

    await connection.query('DELETE FROM user_player_bindings WHERE user_id = ? OR player_id = 11', [lockedState.gaoUser.id]);
    await connection.query(
      'INSERT INTO user_player_bindings (user_id, player_id) VALUES (?, 11)',
      [lockedState.gaoUser.id]
    );

    for (const [playerId, name, account] of players) {
      if (!account) continue;
      const [result] = await connection.query(
        `INSERT INTO users (account, username, password_hash, role, must_change_password, auth_version)
         VALUES (?, ?, ?, 'player', 1, 0)`,
        [account, name, passwordHash]
      );
      await connection.query(
        'INSERT INTO user_player_bindings (user_id, player_id) VALUES (?, ?)',
        [result.insertId, playerId]
      );
    }

    await connection.commit();
    transactionStarted = false;

    const [[summary]] = await connection.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE must_change_password = 1) AS must_change_count,
         (SELECT COUNT(*) FROM user_player_bindings) AS binding_count,
         (SELECT COUNT(*) FROM users WHERE username = 'Kirito') AS kirito_count`
    );
    console.log('PLAYER_ACCOUNT_MIGRATION_OK', summary);
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    console.error('PLAYER_ACCOUNT_MIGRATION_FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
