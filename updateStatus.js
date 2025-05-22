const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
  try {
    // Simular uma atualização de status
    const { equipmentId, newStatus, details } = req.body;
    if (!equipmentId || !newStatus) {
      return res.status(400).json({ error: 'equipmentId e newStatus são obrigatórios.' });
    }

    // Atualizar o status do equipamento
    const { error: updateError } = await supabase
      .from('equipments')
      .update({ status: newStatus })
      .eq('id', equipmentId);

    if (updateError) {
      return res.status(500).json({ error: 'Erro ao atualizar status do equipamento.', details: updateError.message });
    }

    // Adicionar ao histórico
    const { error: historyError } = await supabase
      .from('equipment_history')
      .insert({
        equipment_id: equipmentId,
        status: newStatus,
        details: details || 'Atualização via API externa',
        responsible: 'Sistema Externo',
        timestamp: new Date().toISOString(),
        pending_approval: true
      });

    if (historyError) {
      return res.status(500).json({ error: 'Erro ao adicionar ao histórico.', details: historyError.message });
    }

    res.status(200).json({ message: 'Status atualizado com sucesso.' });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno do servidor.', details: e.message });
  }
};
