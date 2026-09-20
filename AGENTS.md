<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# السيل الجارف — قواعد إلزامية لأي AI Agent

المصدر الرسمي للدستور هو قاعدة البيانات (`constitution_sections`, `constitution_rules`).
النسخة المقروءة للبشر في `CONSTITUTION.md` (41 قسمًا، 80 قاعدة) مُولَّدة منها.

## قواعد الفصل الخمسة (خطوط حمراء)

1. **فصل الحقيقة عن التحليل**: Database ← Application/Domain ← AI Analysis ← UI. التحليل لا يعيد كتابة الواقع، ولا يُكتب فوق السجل الأصلي.
2. **فصل أنواع المعرفة**: FACT / USER_INTERPRETATION / HYPOTHESIS / AI_INSIGHT / DECISION / PROPOSAL. لا تحويل تلقائي من نوع إلى آخر؛ الترقية تمر بـ Validation/Confirmation ثم Official Record.
3. **فصل النظام عن الخطة عن الممارسة**: System ≠ System Version ≠ Plan ≠ Practice ≠ Practice Execution ≠ Evaluation. يجب أن نستطيع التمييز: هل الخلل في النظام أم في طريقة تطبيقه في مرحلة؟
4. **فصل الزمن**: `occurred_at` / `recorded_at` / `discovered_at` / `confirmed_at` / `effective_from` / `effective_until` — لا يُستخدم `created_at` بديلًا عن زمن الحدوث.
5. **فصل المصدر والسياق (Provenance)**: لكل معلومة مهمة مصدرها، من سجّلها، من أين استُخرجت، أدلتها، والتحليل الذي اعتمد عليها. التاريخ لا يُمحى؛ الـRollback حدث تاريخي جديد لا استرجاع يمسح ما بعده.

## التسلسل الإلزامي قبل أي مهمة

1. اقرأ `project_description` و`project_execution_summary` للمشروع — لا تخترع وصفًا ولا تستنتجه من الكود.
2. حدِّد حالة التهيئة الفعلية (وصف / دستور / مراحل / مهام / قرارات). إن نقص شيء: اطلبه ولا تخمّن ولا تنشئ بيانات تجريبية.
3. اقرأ `resume_packages` النشِطة و`checkpoints` الأخيرة و`project_decisions` النشِطة و`state_conflicts` المفتوحة.
4. اقرأ القواعد المرتبطة بالمهمة (`task_constitution_rules` + الخطوط الحمراء كلها) وتأكد أن خطتك لا تخالف أيًّا منها.
5. سجّل المهمة `in_progress` واكتب `execution_logs` عند البداية.
6. نفّذ خطوة واحدة قابلة للتحقق في كل مرة، وسجّل الملفات والجداول والواجهات المتغيرة في `task_artifacts`.
7. في النهاية: اكتب `checkpoint` (ما تم، آخر خطوة ناجحة، المتبقي، الإجراء التالي) وحدِّث `resume_packages`، وسجّل أي قرار في `project_decisions` بسببه.
8. لا تنتقل إلى المهمة التالية قبل إغلاق الحالية بـ checkpoint ونتيجة تحقق.

## قواعد قاعدة البيانات

- كل جدول جديد في `public`: CREATE TABLE ← GRANT ← ENABLE RLS ← POLICY، وكل بيانات المستخدم معزولة بـ `auth.uid()`.
- لا حذف مادي للتاريخ: استخدم الحالات والإصدارات والـ soft delete، ومنع UPDATE/DELETE على جداول السجل التاريخي.
