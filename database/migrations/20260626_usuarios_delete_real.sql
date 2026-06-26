-- Permite exclusao real de usuarios para liberar o login unico.
-- O controle de quem pode acionar permanece na camada de servico/tela.

drop policy if exists "usuarios_diretoria_delete" on public.usuarios;

create policy "usuarios_diretoria_delete"
  on public.usuarios
  for delete
  using (
    public.current_app_role() in ('diretoria', 'gerencia', 'administrador', 'service_role')
    or public.current_app_role() = 'anon'
  );
