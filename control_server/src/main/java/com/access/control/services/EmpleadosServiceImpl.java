package com.access.control.services;

import com.access.control.dto.EmpleadoDto;
import com.access.control.model.Empleado;
import com.access.control.model.Piso;
import com.access.control.model.PisoPermiso;
import com.access.control.repository.EmpleadoRepository;
import com.access.control.repository.PisoPermisoRepository;
import com.access.control.repository.PisoRepository;
import org.dozer.DozerBeanMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Service("empleadosServiceImpl")
public class EmpleadosServiceImpl implements EmpleadosService{
    @Autowired
    private EmpleadoRepository empleadosDao;

    @Autowired
    private PisoPermisoRepository pisoPermisoRepository;

    @Autowired
    private PisoRepository pisoDao;

    @Override
    @Transactional
    public List<Empleado> getListEmpleados(boolean picture)
    {   Integer i=0;
        List<Empleado> emp = empleadosDao.findAll();
       /* if (picture) {
          for (i=0 ; i < emp.size(); i++){
              byte[] b = "No disponible".getBytes();
              emp.get(i).setPicture(b);
              emp.get(i).setHuella1(b);
              emp.get(i).setHuella2(b);
          }
        }*/
        return emp;
    }

    @Override
    @Transactional
    public Empleado getEmpleadoById(Long idEmpleado)
    {
        return empleadosDao.findById(idEmpleado).orElse(null);
    }

    @Override
    @Transactional
    public Empleado addEmpleado(EmpleadoDto emp)
    {
        //emp.setPicture(Base64.getDecoder().decode(emp.getPicture()));
       // emp.setPicture(Arrays.asList(emp.getPicture().split(",")).get(1));
        //String encodedString = Base64.getEncoder().encodeToString(emp.geticture());
        //Empleado empleado = new DozerBeanMapper().map(emp, Empleado.class);
        Empleado empleado = new Empleado();
        empleado.setDocument(emp.getDocument());
        empleado.setName(emp.getName());
        empleado.setBadgeAccess(emp.getBadgeAccess());
        empleado.setLastName(emp.getLastName());
        empleado.setBirthDate(emp.getBirthDate());
        empleado.setEmail(emp.getEmail());
        empleado.setSex(emp.getSex());
        empleado.setTelephone(emp.getTelephone());
        empleado.setEnabled(true);
        empleado.setState(1);
        empleado.setPicture(Base64.getDecoder().decode(Arrays.asList(emp.getPicture().split(",")).get(1)));

        List<Piso> pisos = pisoDao.findAllState(1);
        PisoPermiso pisoPermiso = new PisoPermiso();
        List<PisoPermiso> listpp = new ArrayList<>();
        final Empleado finalEmpleado = empleadosDao.save(empleado);
        pisos.forEach(
                p->{
                    pisoPermiso.setEmpleado(finalEmpleado);
                    pisoPermiso.setPiso(p);
                    pisoPermiso.setState(0);
                    listpp.add(pisoPermiso);
                }
        );
        finalEmpleado.setListPisos(pisoPermisoRepository.saveAll(listpp));
        return finalEmpleado;
    }

    @Override
    @Transactional
    public Empleado updateEmpleado(EmpleadoDto emp,Long id)
    {
        Empleado empleado = new Empleado();
        empleado.setId(id);
        empleado.setDocument(emp.getDocument());
        empleado.setName(emp.getName());
        empleado.setBadgeAccess(emp.getBadgeAccess());
        empleado.setLastName(emp.getLastName());
        empleado.setBirthDate(emp.getBirthDate());
        empleado.setEmail(emp.getEmail());
        empleado.setSex(emp.getSex());
        empleado.setTelephone(emp.getTelephone());
        empleado.setEnabled(emp.getEnabled());
        empleado.setState(emp.getState());
        empleado.setPicture(Base64.getDecoder().decode(Arrays.asList(emp.getPicture().split(",")).get(1)));

        if(empleadosDao.findById(id).isPresent()){
            return empleadosDao.saveAndFlush(empleado);
        }
        return null;
    }

    @Override
    @Transactional
    public Empleado updateEmpleadoHuella(Empleado emp,Long id)
    {
        Empleado empleado = new Empleado();
        empleado.setId(id);
        empleado.setHuella1(emp.getHuella1());
        empleado.setHuella2(emp.getHuella2());

        if(empleadosDao.findById(id).isPresent()){
            return empleadosDao.saveAndFlush(empleado);
        }
        return null;
    }

    @Override
    @Transactional
    public boolean deleteEmpleado(Empleado emp)
    {
         empleadosDao.delete(emp);
         return empleadosDao.findById(emp.getId()).isPresent();
    }

    @Override
    @Transactional
    public Empleado updatePisos(Empleado emp){

        pisoPermisoRepository.saveAll(emp.getListPisos());

        return emp;
    }
}
