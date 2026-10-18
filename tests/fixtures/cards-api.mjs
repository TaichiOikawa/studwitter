// In-memory dependencies used only by the cards route tests; no D1 or auth service.
export const rows = [];
export const auth = {
  api: {
    async getSession({headers}) {
      return headers.get('authorization') === 'test-session' ? {user:{id:'test-user'}} : null;
    },
  },
};
export function getPrisma() {
  return {studyCard:{
    async findMany({where}) {
      return rows.filter(row=>row.userId === where.userId).sort((a,b)=>b.createdAt-a.createdAt);
    },
    async upsert({where,create,update}) {
      const key = where.userId_id;
      const index = rows.findIndex(row=>row.id===key.id && row.userId===key.userId);
      if (index === -1) rows.push(create);
      else rows[index] = {...rows[index],...update};
    },
    async deleteMany({where}) {
      for (let i=rows.length-1;i>=0;i--) {
        if (rows[i].userId===where.userId && !where.id?.notIn.includes(rows[i].id)) rows.splice(i,1);
      }
    },
  }};
}
